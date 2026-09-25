import type { FastifyReply, FastifyRequest } from 'fastify';

type Event = { event?: string; data: string; id?: string };
export function createAuthorizedSse(req: FastifyRequest, reply: FastifyReply, options: { pollMs?: number; authorityTimeoutMs?: number; raw?: boolean; writeTimeoutMs?: number } = {}) {
  const service = req.server.authAuthority;
  let closed = false; let pending = 0; let checking = false;
  let timer: ReturnType<typeof setInterval> | undefined;
  let chain = Promise.resolve(true);
  const close = (graceful = false) => {
    if (closed) return;
    closed = true;
    if (timer) clearInterval(timer);
    if (!reply.raw.destroyed && !reply.raw.writableEnded) {
      if(options.raw&&!graceful){reply.raw.destroy();return;}
      const source = (reply as FastifyReply & { sseContext?: { source?: { end(): void } } }).sseContext?.source;
      if (source) source.end(); else reply.raw.end();
    }
  };
  const allowed = async () => {
    if (closed || reply.raw.destroyed || reply.raw.writableEnded) return false;
    if (!service) return true; // The separate explicit fixture profile retains its existing stream probes.
    let deadline: ReturnType<typeof setTimeout> | undefined;
    try {
      const current = await Promise.race([
        service.authenticate(req.authCredential, req.authPrincipal?.transport === 'native'),
        new Promise<null>((resolve) => { deadline = setTimeout(() => resolve(null), options.authorityTimeoutMs ?? 5000); }),
      ]);
      return !!current && current.id === req.authPrincipal?.id && current.user_id === req.authPrincipal?.user_id;
    } catch { return false; }
    finally { if (deadline) clearTimeout(deadline); }
  };
  if (service) {
    timer = setInterval(() => {
      if (checking || closed) return;
      checking = true;
      void allowed().then((valid) => { if (!valid) close(); }).finally(() => { checking = false; });
    }, options.pollMs ?? 1000);
    timer.unref();
  }
  reply.raw.once('close', () => close()); reply.raw.once('finish', () => close());reply.raw.once('error',()=>close());
  const writeRaw=async(frame:string)=>{
    if(closed||reply.raw.destroyed||reply.raw.writableEnded)return false;
    if(Buffer.byteLength(frame)>64*1024||reply.raw.writableLength>128*1024)return false;
    if(!reply.raw.headersSent){
      reply.hijack();
      for(const [name,value] of Object.entries(reply.getHeaders()))if(value!==undefined)reply.raw.setHeader(name,value);
      reply.raw.setHeader('Content-Type','text/event-stream; charset=utf-8');reply.raw.setHeader('Connection','keep-alive');
      reply.raw.setHeader('Cache-Control','no-store, no-transform');reply.raw.setHeader('X-Accel-Buffering','no');
    }
    return new Promise<boolean>((resolve)=>{
      let settled=false;
      const finish=(ok:boolean)=>{if(settled)return;settled=true;clearTimeout(timeout);reply.raw.off('drain',drained);reply.raw.off('close',ended);reply.raw.off('error',ended);resolve(ok);};
      const drained=()=>finish(true),ended=()=>finish(false);
      const timeout=setTimeout(()=>finish(false),options.writeTimeoutMs??1000);timeout.unref();
      reply.raw.once('close',ended);reply.raw.once('error',ended);
      try{if(reply.raw.write(frame))finish(true);else reply.raw.once('drain',drained);}catch{finish(false);}
    });
  };
  const queue=(write:()=>Promise<boolean>):Promise<boolean>=>{
    if(closed)return Promise.resolve(false);
    if(++pending>64){pending--;close();return Promise.resolve(false);}
    chain=chain.then(async()=>{
      try{if(!await allowed()||closed||reply.raw.writableEnded){close();return false;}
        const written=await write();if(!written)close();return written;
      }catch{close();return false;}finally{pending--;}
    });
    return chain;
  };
  return {
    close:()=>close(),finish:()=>close(true),
    comment(value='heartbeat'):Promise<boolean>{
      if(!options.raw||typeof value!=='string'||value.length<1||value.length>80||/[^- a-zA-Z0-9_.]/.test(value))return Promise.resolve(false);
      return queue(()=>writeRaw(`: ${value}\n\n`));
    },
    send(event:Event,guard?:(write:()=>Promise<boolean>)=>Promise<boolean>):Promise<boolean>{
      if(!options.raw)return queue(async()=>{const write=async()=>{reply.sse(event);return true;};return guard?guard(write):write();});
      if(typeof event.data!=='string'||Buffer.byteLength(event.data)>60*1024
        ||event.event!==undefined&&(typeof event.event!=='string'||!/^[a-zA-Z_][a-zA-Z0-9_-]{0,63}$/.test(event.event)||/[\r\n]/.test(event.event))
        ||event.id!==undefined&&(typeof event.id!=='string'||!/^[\x21-\x7e]{1,128}$/.test(event.id)||/[\r\n]/.test(event.id))){close();return Promise.resolve(false);}
      const frame=(event.id===undefined?'':`id: ${event.id}\n`)+(event.event===undefined?'':`event: ${event.event}\n`)
        +event.data.split(/\r\n|\r|\n/).map(line=>`data: ${line}\n`).join('')+'\n';
      return queue(()=>guard?guard(()=>writeRaw(frame)):writeRaw(frame));
    },
  };
}

import { resolveNativeBuildConfig } from './src/platform/native-build-config';

// Only public allowlisted settings are copied. Server env files are never loaded here.
export default resolveNativeBuildConfig(process.env);

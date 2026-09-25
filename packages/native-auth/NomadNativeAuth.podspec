Pod::Spec.new do |s|
  s.name = 'NomadNativeAuth'
  s.version = '0.1.0'
  s.summary = 'Private Nomad native authentication transport'
  s.license = { :type => 'Proprietary' }
  s.homepage = 'https://nomad-test.yinianyunqi.top'
  s.author = 'Nomad'
  s.source = { :path => '.' }
  s.source_files = 'ios/Sources/**/*.{swift,h,m}'
  s.ios.deployment_target = '16.0'
  s.dependency 'Capacitor', '~> 8.5'
  s.swift_version = '5.9'
end

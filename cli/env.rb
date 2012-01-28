module Mulberry
  class Env
    def self.host_os
      case Config::CONFIG['host_os']
        when /mswin|windows/i
          :windows
        when /mingw/i
          :mingw
        when /linux/i
          :linux
        when /darwin/i
          :macos
        else
          :unknown
      end
    end
  end
end

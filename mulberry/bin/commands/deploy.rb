module Mulberry
  module Command
    class Deploy
      def initialize(args, additional_options={})
        OptionParser.new do |opts|
          opts.banner = "Usage: mulberry deploy [options]"

          opts.on("--skip-js-build", "Disable JavaScript build task.  This
                                     option should not be used on real
                                     projects, it's a tool for Mulberry
                                     core developers to bypass this
                                     time-consuming step when working on
                                     other aspects of deployment.") do |v|
            options[:skip_js_build] = v
          end

          opts.on("--publish-ota",   "Publish an OTA with the contents of this
                                     build.") do |v|
            options[:publish_ota] = v
          end

        end.parse!

        dir = Mulberry.get_app_dir args[0]

        app = Mulberry::App.new(dir)
        app.device_build additional_options
      end
    end
  end
end
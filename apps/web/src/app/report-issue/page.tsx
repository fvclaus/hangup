import { Title } from "@/components/ui/title";
import { AlertCircle, Bug } from "lucide-react";
import GithubIcon from "./components/GithubIcon";
import Link from "@/app/Link";

export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center">
      <Title
        subtitle={
          <p className="text-lg text-gray-600">
            Help us improve by reporting any bugs or issues you encounter
          </p>
        }
        icons={[Bug]}
        title="Report an Issue"
      />
      <div className="w-full bg-blue-50 py-16 text-gray-600">
        <div
          id="privacy-policy"
          className="mx-auto rounded-lg w-full max-w-screen-lg"
        >
          <div className="grid gap-6 bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Before Reporting
                </h3>
                <p className="text-gray-600 mt-1">
                  Please check if your issue has already been reported by
                  searching the existing issues on GitHub.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <GithubIcon className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  GitHub Account Required
                </h3>
                <p className="text-gray-600 mt-1">
                  You'll need a GitHub account to create an issue. It's free and
                  easy to sign up.
                </p>
              </div>
            </div>
            <div className="mt-8 flex">
              <Link
                variant="button"
                href="https://github.com/fvclaus/no-meeting-overtime/issues"
                className="inline ml-auto mr-auto"
              >
                <Bug className="w-5 h-5 inline mr-2" />
                <span>Create New Issue on GitHub</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

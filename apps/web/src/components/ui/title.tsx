import { Calendar, Clock } from "lucide-react";
import { ReactNode } from "react";

export function Title({
  title,
  subtitle,
  icons = [Clock, Calendar],
}: {
  title: string | React.JSX.Element;
  subtitle?: string | React.JSX.Element;
  icons?: ((props: { className: string }) => ReactNode)[];
}) {
  return (
    <>
      <div className="w-full max-w-4xl text-center px-4 mb-8">
        <div className="flex justify-center space-x-6 mb-8">
          {icons.map((Icon, i) => (
            <div
              key={`${typeof title === "string" ? title : Date.now()}-${i}`}
              className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center transition-colors hover:bg-blue-100"
            >
              <Icon className="h-6 w-6 text-blue-600" />
            </div>
          ))}
        </div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-800 sm:text-5xl">
          {title}
        </h1>
        {subtitle && typeof subtitle === "string" ? (
          <p className="text-lg text-gray-600">{subtitle}</p>
        ) : (
          subtitle
        )}
      </div>
    </>
  );
}

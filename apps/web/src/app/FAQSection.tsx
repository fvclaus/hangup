import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Clock } from "lucide-react";

export default function FAQSection() {
  return (
    <div className="mt-16">
      <h2 className="text-2xl font-semibold mb-4 text-center flex items-center justify-center text-gray-800">
        <Clock className="w-6 h-6 mr-2 text-blue-600" />
        Frequently Asked Questions
      </h2>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1" className="border-blue-200">
          <AccordionTrigger className="text-gray-700 hover:text-blue-600">
            How does it work on a technical level?
          </AccordionTrigger>
          <AccordionContent className="text-gray-600 text-left">
            This app integrates with the Google Meet API to create and end
            meetings. When you start a meeting, this app sends a request to the
            Google Meet API to create a new meeting. At the scheduled end time,
            another request is sent to the Google Meet API to end the meeting.
            The meeting can only be ended if it is active at that moment.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2" className="border-blue-200">
          <AccordionTrigger className="text-gray-700 hover:text-blue-600">
            Why can it not end meetings I created myself?
          </AccordionTrigger>
          <AccordionContent className="text-gray-600 text-left">
            The app can only end meetings that it created itself due to
            limitations in the Google Meet API. These ensures that apps in
            general cannot interfere with meetings created by other means.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

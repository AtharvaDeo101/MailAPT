import type { Metadata } from "next";
import { InfoPage } from "@/components/landing/info-page";

export const metadata: Metadata = {
  title: "Terms of Service — Dispatch",
  description: "The terms you agree to when using Dispatch.",
};

export default function TermsPage() {
  return (
    <InfoPage
      title="Terms of Service"
      intro="These terms cover your use of Dispatch. By signing in with your Google account, you agree to them."
      updated="7 August 2026"
      sections={[
        {
          heading: "1. The service",
          paragraphs: [
            "Dispatch is an AI-assisted client for your own Gmail mailbox. It lets you read, write, organise, schedule and send mail through the Gmail API, and uses a language model to draft and summarise email text.",
            "Dispatch is an independent project. It is not affiliated with, endorsed by, or sponsored by Google, Meta or Hugging Face.",
          ],
        },
        {
          heading: "2. Your account",
          paragraphs: [
            "You need a Google account to use Dispatch, and you must have the right to use the mailbox you connect. You are responsible for keeping that Google account secure.",
            "You can disconnect at any time by signing out, or by revoking Dispatch's access from your Google Account permissions page. Revoking access ends Dispatch's ability to reach your mailbox immediately.",
          ],
        },
        {
          heading: "3. Acceptable use",
          paragraphs: ["You agree not to use Dispatch to:"],
          bullets: [
            "Send spam, bulk unsolicited mail, phishing messages or anything designed to deceive a recipient about who sent it.",
            "Harass, threaten or impersonate any person or organisation.",
            "Break any law that applies to you, or any rule of the Gmail Program Policies or Google Terms of Service.",
            "Attempt to break, overload, reverse-engineer or gain unauthorised access to the service or its infrastructure.",
            "Automate access in a way that exceeds normal personal use, or that circumvents rate limits.",
          ],
        },
        {
          heading: "4. AI-generated content",
          paragraphs: [
            "Drafts and summaries are produced by a language model. Model output can be wrong, incomplete, or misleading, and a summary can omit something that mattered.",
            "You are responsible for everything you send. Read AI-generated text before sending it, and do not rely on a summary for decisions where the original message is what counts — legal, financial, medical or safety-related matters especially.",
            "As between you and Dispatch, the content you write and the output you generate is yours. You are responsible for making sure it does not infringe anyone else's rights.",
          ],
        },
        {
          heading: "5. Third-party services",
          paragraphs: [
            "Dispatch depends on services it does not control: the Gmail API for all mail operations, and the Hugging Face Inference API for model responses. Their availability, limits and terms govern those parts of the experience, and an outage or rate limit on their side can interrupt Dispatch.",
            "Gmail enforces per-user rate limits. Heavy use may cause requests to be delayed or temporarily refused.",
          ],
        },
        {
          heading: "6. Scheduled sends",
          paragraphs: [
            "Scheduled emails are queued and sent on a best-effort basis. Delivery at an exact minute is not guaranteed, and a send can fail if your Google authorisation has expired, the mailbox is unavailable, or the service is interrupted. Do not rely on scheduling for time-critical mail without checking that it went out.",
          ],
        },
        {
          heading: "7. Availability and changes",
          paragraphs: [
            "Dispatch is provided as-is, with no guarantee of uptime. Features may change or be removed, and the service may be suspended or discontinued at any time.",
            "These terms may be updated. Material changes will be reflected in the date at the top of this page; continuing to use Dispatch after a change means you accept the updated terms.",
          ],
        },
        {
          heading: "8. Disclaimer and liability",
          paragraphs: [
            "To the fullest extent permitted by law, Dispatch is provided without warranties of any kind, express or implied, including fitness for a particular purpose and non-infringement.",
            "To the fullest extent permitted by law, the operator of Dispatch is not liable for any indirect, incidental or consequential damages, or for lost data, lost mail, missed sends, or loss of profits arising from your use of the service.",
            "Nothing here limits liability that cannot be limited under the law that applies to you.",
          ],
        },
        {
          heading: "9. Termination",
          paragraphs: [
            "You may stop using Dispatch at any time. Access may be suspended or terminated if these terms are breached, or if required to protect the service or its users.",
          ],
        },
        {
          heading: "10. Contact",
          paragraphs: [
            "Questions about these terms can be sent to atharva20051@gmail.com, or raised through any of the channels on the Contact page.",
          ],
        },
      ]}
    />
  );
}

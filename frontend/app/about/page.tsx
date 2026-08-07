import type { Metadata } from "next";
import { InfoPage } from "@/components/landing/info-page";

export const metadata: Metadata = {
  title: "About — Dispatch",
  description:
    "Dispatch is an AI-assisted Gmail client: AI drafting, one-click summaries, scheduled sends, folders, to-do lists and notes, all on top of your own mailbox.",
};

export default function AboutPage() {
  return (
    <InfoPage
      title="About Dispatch"
      intro="Dispatch is an AI-assisted Gmail client. It signs in with your Google account, reads and sends real mail through the Gmail API, and adds the things a plain inbox is missing."
      sections={[
        {
          heading: "Why it exists",
          paragraphs: [
            "Most of the time spent in an inbox is not reading — it is deciding. Deciding what a long thread actually asks for, deciding how to phrase a reply that has to sound right, deciding what can wait until Monday.",
            "Dispatch puts a language model directly where those decisions happen. You describe the email you want and get back a subject and a full body you can edit. You open a long message and get a summary with the action items pulled out. You write the reply now and schedule it to leave at a reasonable hour.",
          ],
        },
        {
          heading: "What it does",
          bullets: [
            "Full inbox client — Inbox, Sent, Drafts, Scheduled, custom folders and Gmail labels, with search across sender and subject.",
            "AI drafting — describe the email in a chat-style composer; the model returns a subject and body, with live preview before you send.",
            "Summaries — brief or detailed summaries of any open message, including key points, action items and sentiment.",
            "Scheduled sends — queue an email for later and cancel it any time before it goes out.",
            "Organisation — move messages to folders, mark read-later, bulk select, delete to Gmail Trash.",
            "Side rail — to-do lists you can stick to the screen as floating cards, plus free-form notes, without leaving the inbox.",
          ],
        },
        {
          heading: "How it is built",
          paragraphs: [
            "The frontend is Next.js and React. The backend is Flask, talking to the Gmail API with your OAuth credentials and to Postgres for drafts, schedules, folders, notes and per-account settings.",
            "The AI features run on meta-llama/Llama-3.1-8B-Instruct through the Hugging Face Inference API. Only the text you are generating from or summarising is sent for a request — never your whole mailbox.",
          ],
        },
        {
          heading: "Your mailbox stays yours",
          paragraphs: [
            "Dispatch works against your own Gmail account. Nothing is mirrored to a third-party mail service, and mail you never open in Dispatch is never fetched. See the Privacy Policy for exactly what is stored and where.",
          ],
        },
        {
          heading: "Who made it",
          paragraphs: [
            "Dispatch is built and maintained by Atharva Deo as an independent project. The source lives on GitHub, and bug reports and feature ideas are welcome — see the Contact page.",
          ],
        },
      ]}
    />
  );
}

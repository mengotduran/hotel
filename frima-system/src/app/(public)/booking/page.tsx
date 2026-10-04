import type { Metadata } from "next";
import { BookingTracker } from "@/components/site/BookingTracker";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Suivre ma demande" };

export default async function BookingTrackerPage(props: PageProps<"/booking">) {
  const search = await props.searchParams;
  const reference = typeof search.ref === "string" ? search.ref : "";
  return <BookingTracker initialRef={reference} />;
}

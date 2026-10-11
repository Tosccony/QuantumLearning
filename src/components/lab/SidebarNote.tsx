import Markdown from "@/components/Markdown";
import Icon from "@/components/ui/Icon";

/** A lesson's side note under the tutor: a ghost frame, the shape of anything that is a note rather than a tool. */
export default function SidebarNote({ note }: { note: { heading: string; body: string } }) {
  return (
    <section className="frame frame-ghost mt-4 flex items-start gap-3 px-3 py-3 text-sm" aria-label={note.heading}>
      <Icon name="info" size={16} className="mt-0.5 shrink-0 text-ice" />
      <div className="min-w-0">
        <h2 className="label-sm text-fog">{note.heading}</h2>
        <Markdown text={note.body} className="on-navy !text-sm" />
      </div>
    </section>
  );
}

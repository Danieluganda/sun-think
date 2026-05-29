import { Download } from "lucide-react";
import { Button } from "../common/Button.jsx";

export function DownloadCard({ title, description, onDownload }) {
  return (
    <article className="download-card">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <Button icon={Download} onClick={onDownload}>Download</Button>
    </article>
  );
}

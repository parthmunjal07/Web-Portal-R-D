"use client";

import Link from "next/link";
import { money } from "@/lib/domain";
import { DeleteAction } from "../admin/delete-action";
import { Status } from "../ui";
import { ClickableTableRow } from "../clickable-table-row";

export type ProjectRow = {
  id: string;
  code: string;
  name: string;
  owner: string;
  funder: string;
  budget: number;
  spent: number;
  status: string;
};

export function ProjectTableRow({
  project,
  canDelete,
}: {
  project: ProjectRow;
  canDelete: boolean;
}) {
  const href = `/projects/${project.id}`;

  return (
    <ClickableTableRow href={href} label={`Open project ${project.name}`}>
      <td>
        <Link className="link" href={href}>
          {project.name}
        </Link>
        <span className="sub">{project.code}</span>
      </td>
      <td>{project.owner}</td>
      <td>{project.funder}</td>
      <td>{money(project.budget)}</td>
      <td>{money(project.spent)}</td>
      <td>{money(project.budget - project.spent)}</td>
      <td>
        <Status status={project.status} />
      </td>
      {canDelete && (
        <td>
          <DeleteAction entity="projects" id={project.id} name={project.name} />
        </td>
      )}
    </ClickableTableRow>
  );
}

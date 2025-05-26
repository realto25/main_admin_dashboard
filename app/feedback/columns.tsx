"use client";

import { ColumnDef } from "@tanstack/react-table";

export type FeedbackColumn = {
  id: string;
  bookingId: string;
  rating: number;
  experience: string;
  suggestions: string;
  purchaseInterest: string;
  plot: string;
  date: string;
};

export const columns: ColumnDef<FeedbackColumn>[] = [
  {
    accessorKey: "plot",
    header: "Plot",
  },
  {
    accessorKey: "rating",
    header: "Rating",
  },
  {
    accessorKey: "experience",
    header: "Experience",
  },
  {
    accessorKey: "suggestions",
    header: "Suggestions",
  },
  {
    accessorKey: "purchaseInterest",
    header: "Interested?",
  },
  {
    accessorKey: "date",
    header: "Date",
  },
];

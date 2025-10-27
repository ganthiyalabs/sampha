import * as React from "react";
import { cn } from "@/lib/utils";

const Table = React.forwardRef<HTMLTableElement, React.ComponentPropsWithoutRef<"table">>(
  ({ className, ...props }, ref) => (
    <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
  )
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.ComponentPropsWithoutRef<"thead">
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.ComponentPropsWithoutRef<"tbody">
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.ComponentPropsWithoutRef<"tfoot">
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0 border-border",
      className
    )}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<HTMLTableRowElement, React.ComponentPropsWithoutRef<"tr">>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b transition-colors hover:bg-accent/50 data-[state=selected]:bg-accent border-border",
        className
      )}
      {...props}
    />
  )
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<HTMLTableCellElement, React.ComponentPropsWithoutRef<"th">>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "text-muted-foreground h-10 px-3 text-left align-middle font-medium border-border",
        className
      )}
      {...props}
    />
  )
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<HTMLTableCellElement, React.ComponentPropsWithoutRef<"td">>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn("p-3 align-middle border-border", className)} {...props} />
  )
);
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.ComponentPropsWithoutRef<"caption">
>(({ className, ...props }, ref) => (
  <caption ref={ref} className={cn("mt-4 text-sm", className)} {...props} />
));
TableCaption.displayName = "TableCaption";

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };

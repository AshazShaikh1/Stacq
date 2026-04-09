import { Inbox } from "lucide-react"

interface EmptyStateProps {
    title?: string;
    description?: string;
    icon?: React.ReactNode;
    actionButton?: React.ReactNode;
}

export function EmptyState({ 
    title = "Nothing to see here yet", 
    description = "Check back soon — the curator is still refining this stack.",
    icon = <Inbox className="w-12 h-12 text-primary opacity-50 mb-4" />,
    actionButton
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-12 py-24 text-center rounded-3xl border-2 border-dashed border-border bg-surface/50 mt-4 animate-in fade-in duration-500">
            {icon}
            <h3 className="text-xl font-black text-foreground mb-2 mt-4">{title}</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-8 font-medium">
                {description}
            </p>
            {actionButton && (
                <div className="animate-in slide-in-from-bottom-2 duration-700">
                    {actionButton}
                </div>
            )}
        </div>
    )
}

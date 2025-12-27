"use client"

export function SignatureBadge() {
  return (
    <a
      href="https://github.com/metesahankurt"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 group"
    >
      <div className="glass-card flex items-center justify-center px-3 py-1.5 rounded-md hover:border-primary/20 transition-all duration-200">
        <span className="text-[11px] font-medium tracking-wider text-muted group-hover:text-primary transition-colors">
          MD
        </span>
      </div>
    </a>
  )
}

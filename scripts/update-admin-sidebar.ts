import fs from 'fs';

let content = fs.readFileSync('src/components/admin-sidebar.tsx', 'utf8');

if (!content.includes('GraduationCap')) {
  content = content.replace(
    /Sparkles\r?\n\} from ["']lucide-react["'];/,
    'Sparkles,\r\n  GraduationCap\r\n} from "lucide-react";'
  );
}

if (!content.includes('/admin/training')) {
  const target = '{/* Payments */}';
  const addition = `{/* Training Academy */}
            <Link
              href="/admin/training"
              className={\`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all \${
                pathname.startsWith("/admin/training")
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-primary-foreground/70 hover:bg-accent-orange/10 hover:text-sidebar-foreground"
              }\`}
            >
              <GraduationCap className="h-4 w-4 text-accent-orange" />
              Training Academy
            </Link>

            `;
  content = content.replace(target, addition + target);
}

fs.writeFileSync('src/components/admin-sidebar.tsx', content, 'utf8');
console.log('Sidebar updated with Training Academy!');

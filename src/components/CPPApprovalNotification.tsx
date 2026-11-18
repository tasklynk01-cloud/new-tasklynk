'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, CheckCircle2 } from 'lucide-react';

interface CPPLevelInfo {
  level: number;
  levelName: string;
  description: string;
  completedOrdersRequired: number;
  cppNonTechnical: number;
  cppTechnical: number;
  progressBarColor: string;
}

interface CPPApprovalNotificationProps {
  cppLevels?: CPPLevelInfo[];
  isApproved?: boolean;
}

export default function CPPApprovalNotification({
  cppLevels = [],
  isApproved = false,
}: CPPApprovalNotificationProps) {
  if (cppLevels.length === 0) {
    return null;
  }

  return (
    <Card className="border-emerald-200/80 dark:border-emerald-900/60 bg-gradient-to-r from-emerald-50/70 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/15 shadow-sm">
      <CardHeader className="py-3 px-4 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            Earnings Tier System
          </CardTitle>
          {isApproved && (
            <Badge
              variant="secondary"
              className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 text-[11px] font-medium gap-1"
            >
              <CheckCircle2 className="w-3 h-3" />
              Account Approved
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-3 pt-1 space-y-2.5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {cppLevels.map((level) => (
            <div
              key={level.level}
              className="p-2.5 rounded-lg border-l-4 border bg-white/95 dark:bg-slate-900/70 shadow-xs space-y-1"
              style={{ borderLeftColor: level.progressBarColor }}
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-white"
                  style={{ backgroundColor: level.progressBarColor }}
                >
                  Tier {level.level}
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {level.completedOrdersRequired}+ orders
                </span>
              </div>
              <p className="font-semibold text-xs leading-tight">{level.levelName}</p>
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/60">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  KSh {level.cppNonTechnical}
                </span>
                <span className="text-muted-foreground">
                  Tech <strong className="text-foreground">KSh {level.cppTechnical}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground">
          Base rates start at KSh 150/page (+KSh 20 technical bonus) and unlock automatically as you complete orders.
        </p>
      </CardContent>
    </Card>
  );
}

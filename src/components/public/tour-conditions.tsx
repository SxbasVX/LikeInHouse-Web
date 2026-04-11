"use client";

import { Heart, Baby, Volume2, Users, Dumbbell, Info } from "lucide-react";

type ConditionType = "HEALTH" | "AGE" | "BEHAVIOR" | "GROUP_SIZE" | "PHYSICAL" | "GENERAL";

interface Condition {
  id: string;
  type: ConditionType;
  textEs: string;
  textEn: string;
}

const TYPE_CONFIG: Record<ConditionType, { icon: React.ElementType; color: string; bgColor: string; labelEs: string; labelEn: string }> = {
  HEALTH:     { icon: Heart,     color: "text-red-600",    bgColor: "bg-red-50 border-red-200",    labelEs: "Salud",            labelEn: "Health" },
  AGE:        { icon: Baby,      color: "text-blue-600",   bgColor: "bg-blue-50 border-blue-200",   labelEs: "Edad",             labelEn: "Age" },
  BEHAVIOR:   { icon: Volume2,   color: "text-amber-600",  bgColor: "bg-amber-50 border-amber-200", labelEs: "Comportamiento",   labelEn: "Behavior" },
  GROUP_SIZE: { icon: Users,     color: "text-green-600",  bgColor: "bg-green-50 border-green-200", labelEs: "Grupo mínimo",     labelEn: "Minimum group" },
  PHYSICAL:   { icon: Dumbbell,  color: "text-purple-600", bgColor: "bg-purple-50 border-purple-200", labelEs: "Condición física", labelEn: "Physical condition" },
  GENERAL:    { icon: Info,      color: "text-gray-600",   bgColor: "bg-gray-50 border-gray-200",   labelEs: "Importante",       labelEn: "Important" },
};

interface TourConditionsProps {
  conditions: Condition[];
  isEs: boolean;
}

export function TourConditions({ conditions, isEs }: TourConditionsProps) {
  if (!conditions || conditions.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">⚠️</span>
        <h3 className="font-bold text-lg text-foreground">
          {isEs ? "Condiciones importantes" : "Important conditions"}
        </h3>
      </div>
      <div className="space-y-2">
        {conditions.map((condition) => {
          const config = TYPE_CONFIG[condition.type] || TYPE_CONFIG.GENERAL;
          const Icon = config.icon;
          const text = isEs ? condition.textEs : condition.textEn;
          return (
            <div
              key={condition.id}
              className={`flex items-start gap-3 rounded-xl border p-3.5 ${config.bgColor}`}
            >
              <div className={`mt-0.5 shrink-0 ${config.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${config.color} block mb-0.5`}>
                  {isEs ? config.labelEs : config.labelEn}
                </span>
                <p className="text-sm text-foreground leading-snug">{text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

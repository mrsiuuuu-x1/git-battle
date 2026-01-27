"use client";
import { useEffect } from "react";

interface DamageNumberProps {
    id: number;
    value: string | number;
    x: number;
    y: number;
    color?: string;
    onComplete: (id:number) => void;
}

export default function DamageNumber({id,value,x,y,color="#ff6b6b",onComplete}: DamageNumberProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete(id);
        },800);
        return () => clearTimeout(timer);
    },[id,onComplete]);
    return (
        <div
            className="absolute z-50 retro-font text-4xl font-bold animate-float drop-shadow-[2px_2px_0_#000]"
            style={{
                left: `${x}%`,
                top: `${y}%`,
                color: color,
                textShadow: "2px 2px 0px black"
            }}
        >
            {value}
        </div>
    );
}
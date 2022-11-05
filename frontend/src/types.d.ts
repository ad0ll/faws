import React from "react";

export type FCWithChildren<P = {}> = React.FC<P & {children: React.ReactNode}>
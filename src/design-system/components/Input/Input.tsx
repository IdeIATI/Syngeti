"use client";

import React, { useId } from "react";

interface BaseFieldProps {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    BaseFieldProps {
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id,
      label,
      hint,
      error,
      leftIcon,
      rightElement,
      containerClassName = "",
      className = "",
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className={`space-y-1.5 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-[13px] font-semibold text-foreground block ml-0.5"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 inset-y-0 flex items-center pointer-events-none text-text-muted">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? true : undefined}
            className={`w-full min-h-[42px] bg-input border ${
              error ? "border-danger" : "border-border"
            } text-foreground text-sm rounded-xl py-2.5 ${
              leftIcon ? "pl-10" : "pl-3.5"
            } ${
              rightElement ? "pr-11" : "pr-3.5"
            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:border-primary transition-colors placeholder:text-text-muted disabled:opacity-50 ${className}`}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-2 inset-y-0 flex items-center">
              {rightElement}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs font-medium text-danger" role="alert">
            {error}
          </p>
        ) : hint ? (
          <p className="text-xs text-text-muted">{hint}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement>,
    BaseFieldProps {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ id, label, hint, error, containerClassName = "", className = "", children, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || generatedId;

    return (
      <div className={`space-y-1.5 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={selectId}
            className="text-[13px] font-semibold text-foreground block ml-0.5"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          className={`w-full min-h-[42px] bg-input border ${
            error ? "border-danger" : "border-border"
          } text-foreground text-sm rounded-xl px-3.5 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:border-primary transition-colors disabled:opacity-50 ${className}`}
          {...props}
        >
          {children}
        </select>
        {error ? (
          <p className="text-xs font-medium text-danger" role="alert">
            {error}
          </p>
        ) : hint ? (
          <p className="text-xs text-text-muted">{hint}</p>
        ) : null}
      </div>
    );
  }
);
Select.displayName = "Select";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    BaseFieldProps {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ id, label, hint, error, containerClassName = "", className = "", ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id || generatedId;

    return (
      <div className={`space-y-1.5 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={textareaId}
            className="text-[13px] font-semibold text-foreground block ml-0.5"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={error ? true : undefined}
          className={`w-full min-h-[96px] bg-input border ${
            error ? "border-danger" : "border-border"
          } text-foreground text-sm rounded-xl px-3.5 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:border-primary transition-colors placeholder:text-text-muted disabled:opacity-50 ${className}`}
          {...props}
        />
        {error ? (
          <p className="text-xs font-medium text-danger" role="alert">
            {error}
          </p>
        ) : hint ? (
          <p className="text-xs text-text-muted">{hint}</p>
        ) : null}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

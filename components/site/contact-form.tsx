"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema, type ContactInput } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { submitContact } from "@/features/auth/actions";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
  });

  async function onSubmit(data: ContactInput) {
    setError(null);
    try {
      const result = await submitContact(data);
      if (result.ok) {
        setSubmitted(true);
        reset();
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    } catch {
      setError("Could not send right now. Try again or email directly.");
    }
  }

  if (submitted) {
    return (
      <div className="border border-fire/40 bg-fire/5 p-10 rounded-sm">
        <CheckCircle2 className="h-12 w-12 text-fire mb-6" strokeWidth={1.5} />
        <h2 className="display-md mb-4">Message received.</h2>
        <p className="text-bone-300 leading-relaxed">
          Thanks for reaching out. I'll get back to you within 24 hours on business days.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-8 text-sm border-b border-ink-700 hover:border-fire hover:text-fire pb-1 transition-all"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
      <p className="eyebrow">— Project brief</p>

      <div className="grid sm:grid-cols-2 gap-8">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" {...register("name")} placeholder="Your full name" />
          {errors.name && <p className="text-fire text-xs">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" {...register("email")} placeholder="you@company.com" />
          {errors.email && <p className="text-fire text-xs">{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-8">
        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Input id="company" {...register("company")} placeholder="Optional" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="budget">Budget</Label>
          <select
            id="budget"
            {...register("budget")}
            className="flex h-12 w-full border-0 border-b border-ink-700 bg-transparent text-base focus-visible:outline-none focus-visible:border-fire transition-colors"
          >
            <option value="" className="bg-ink">Select range</option>
            <option value="<5k" className="bg-ink">Under $5K</option>
            <option value="5-15k" className="bg-ink">$5K — $15K</option>
            <option value="15-30k" className="bg-ink">$15K — $30K</option>
            <option value="30k+" className="bg-ink">$30K+</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Tell me about your project *</Label>
        <Textarea
          id="message"
          rows={6}
          {...register("message")}
          placeholder="Goals, timeline, anything you'd like me to know..."
        />
        {errors.message && <p className="text-fire text-xs">{errors.message.message}</p>}
      </div>

      {error && (
        <div className="border border-fire/40 bg-fire/5 px-4 py-3 text-sm text-fire">
          {error}
        </div>
      )}

      <Button type="submit" size="lg" disabled={isSubmitting} className="group">
        {isSubmitting ? "Sending..." : "Send Message"}
        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:rotate-45" />
      </Button>
    </form>
  );
}

# Example: Bug Fix with continuous-improvement

## Scenario

User reports: "Login form submits twice on slow connections"

## Agent without the framework

```
You: The login form is submitting twice on slow connections. Fix it.

Agent: I'll add a disabled state to the submit button.
       *edits LoginForm.tsx — adds useState for isSubmitting*
       Done! The button now disables after the first click.

You: It's still happening. The double submit comes from the form's onSubmit, not the button.

Agent: Ah, I see. Let me also add a guard in the submit handler.
       *adds early return if already submitting*
       Now it should work!

You: You forgot to re-enable the button when login fails.

Agent: Good catch. *adds finally block*
       Now it works!

You: Did you test it on a slow connection?

Agent: ...no. Let me check. Oh — the loading spinner I added has a CSS animation
       that conflicts with the existing one. Let me fix that too...
```

4 rounds. 3 bugs introduced and caught by the user. No research, no testing.

## Agent with continuous-improvement

```
You: The login form is submitting twice on slow connections. Fix it.

Agent: **[Law 1: Research]**
       Searching codebase for submit handling...
       - LoginForm.tsx:42 — onSubmit calls authService.login()
       - No debounce or guard anywhere
       - The form uses React Hook Form (found in package.json)
       - React Hook Form has built-in `isSubmitting` from formState

       Checking existing patterns...
       - SignupForm.tsx uses formState.isSubmitting — this is the established pattern
       - No custom loading state needed

       **[Law 2: Plan]**
       WILL: Use formState.isSubmitting (matches SignupForm pattern) to:
         1. Disable button during submission
         2. Prevent duplicate onSubmit calls
       WILL NOT: Add custom useState, custom debounce, or loading spinners
       VERIFY: npm test + manual test with Network tab throttled to Slow 3G

       **[Law 3: Execute]**
       Changed LoginForm.tsx:
       - Destructured `isSubmitting` from `formState`
       - Added `disabled={isSubmitting}` to submit button
       - React Hook Form already prevents resubmission internally

       **[Law 4: Verify]**
       ✓ npm test — 23/23 passing
       ✓ Throttled to Slow 3G → clicked submit 5 times rapidly → only 1 network request
       ✓ Failed login (wrong password) → button re-enables correctly
       ✓ Matches existing SignupForm pattern exactly

       Done. 3 lines changed in LoginForm.tsx. Used existing React Hook Form
       feature instead of custom state.
```

1 round. Correct on first attempt. Consistent with existing codebase patterns.

## Which laws made the difference?

| Law | Impact |
|-----|--------|
| **Law 1: Research** | Found existing `isSubmitting` pattern in SignupForm — no need to reinvent |
| **Law 2: Plan** | Explicit "WILL NOT" prevented scope creep (no custom spinner, no debounce) |
| **Law 4: Verify** | Tested the actual failure case (slow connection + rapid clicks) instead of assuming |
| **Law 6: Iterate** | One change only — didn't "also quickly add" a loading spinner |

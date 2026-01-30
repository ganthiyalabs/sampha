# Sampha — Product Requirements Document (PRD)

## 1. Overview

**Sampha** is a fast, minimal, and opinionated-enough work management tool built for GanthiyaLabs. It is a **todo list on steroids** designed to support high-velocity execution and deliberate planning without the overhead of heavyweight project management tools.

Sampha aims to be a **simplified Linear for developers**, with first-class support for:
- Multi-project work
- Deep collaboration
- Strong planning primitives (Gantt, Calendar)
- Tight (but optional) GitHub integration

The product prioritizes **execution speed** and **planning clarity** above all else.

---

## 2. Goals & Non-Goals

### Goals
- Enable teams to plan work quickly and execute without friction
- Provide a clear, shared view of who is doing what and when
- Make long-term timelines and dependencies visible and enforceable
- Support fast-paced shipping environments with minimal ceremony

### Non-Goals
- No time tracking
- No sprint / velocity planning
- No AI features in v1 (explicitly deferred)
- Not a general-purpose documentation tool
- Not a replacement for GitHub

---

## 3. Target Users

Primary users:
- Software developers at GanthiyaLabs

Secondary users:
- Designers, operators, or collaborators who need visibility and light interaction

Assumption:
- Users are technically proficient and comfortable with dense, functional UIs

---

## 4. Product Philosophy

- **Lightly opinionated**: Sampha provides strong defaults but does not lock teams into rigid workflows
- **Planning-first, execution-always**: Planning tools exist to accelerate execution, not replace it
- **Minimal but powerful**: Every feature must earn its place
- **Strict where it matters**: Dates, ownership, and timelines are enforced

---

## 5. Core Concepts & Data Model

### 5.1 Unit of Work

The atomic unit of work in Sampha is a **Task**.

GitHub is optional. A task may exist independently or be linked to a GitHub Issue or Pull Request.

Sampha is the **source of truth for planning and execution**, while GitHub remains the source of truth for code.

---

### 5.2 Hierarchy

Sampha enforces a clear hierarchy:

- **Project**
  - **Phase** (logical grouping or milestone)
    - **Task**
      - **Subtasks** (checkbox-style, non-hierarchical)

Rules:
- Subtasks do not have assignees or dates
- Tasks may not exist outside a phase
- Phases may optionally have start/end dates

---

## 6. Planning & Views

### 6.1 Gantt View (Primary)

The Gantt view is the **main planning surface** in Sampha.

Capabilities:
- Visualize projects, phases, and tasks on a strict timeline
- Drag-to-adjust start and end dates
- Enforce date constraints
- Display assignees and task status inline
- Highlight conflicts, overlaps, and missed deadlines

If users never open other views, Sampha should remain fully usable via Gantt.

---

### 6.2 Calendar View

- Day / week / month views of tasks
- Shows tasks based on start/end dates
- Useful for short-term planning and review

---

### 6.3 Kanban View

- Status-based columns (configurable)
- Optimized for execution tracking
- Secondary to Gantt, not a replacement

---

## 7. Task Lifecycle

### 7.1 Core Task Properties

- Title
- Description (Markdown)
- Status
- Start date
- Due date (strict)
- Assignees (multiple allowed)
- Watchers
- Parent phase
- Optional GitHub link (Issue or PR)

---

### 7.2 Status

- Statuses have sensible defaults (e.g. Backlog, In Progress, Blocked, Done)
- Teams may customize status names
- Status changes are reflected across all views

---

## 8. Collaboration

### 8.1 Assignees & Watchers

- Tasks may have multiple assignees
- Watchers receive updates but are not owners
- Ownership is collective, not singular

---

### 8.2 Comments & Discussions

- Tasks have a comment thread, similar to Linear
- Comments support Markdown
- If a task is linked to a GitHub Issue or PR:
  - Comments are synced bidirectionally
  - GitHub activity appears in the task timeline

---

## 9. Notifications

Notifications are **fully configurable** per user.

Possible triggers:
- Task assignment
- Status change
- Comment mention
- Due date approaching
- Deadline missed

Defaults should be conservative to avoid noise.

---

## 10. GitHub Integration (v1 Scope)

Supported features:
- Link a task to an existing GitHub Issue or PR
- Create a GitHub Issue from a Sampha task
- Display PR status (open, merged, closed)
- Auto-update task status when linked PR is merged
- Sync comments between Sampha and GitHub when linked

Out of scope for v1:
- Full issue mirroring
- Repository-level planning

---

## 11. Permissions & Access (Initial)

- Workspace-level membership
- Project-level access control (read / write)
- No granular per-field permissions in v1

---

## 12. UX & Aesthetic Principles

- Minimal, distraction-free UI
- Keyboard-first interactions
- Fast load times and instant feedback
- Dense but readable layouts
- No unnecessary animations

---

## 13. Future Considerations (Explicitly Deferred)

- AI-assisted planning or summarization
- Predictive timelines
- Cross-workspace dependencies
- External stakeholder views

---

## 14. Success Metrics

Sampha is successful if it:
- Reduces coordination overhead
- Makes weekly planning achievable in minutes
- Prevents forgotten or silently blocked work
- Provides a single, trusted view of ongoing work

---

**Sampha exists to help GanthiyaLabs ship faster, with clarity and intent.**


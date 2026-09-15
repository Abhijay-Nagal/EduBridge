# EduBridge — UML Diagrams (Mermaid source for draw.io)

How to import:
**draw.io → Arrange → Insert → Advanced → Mermaid** → paste code → Insert.

---

## 1. Use Case Diagram

```mermaid
flowchart LR

%% ================= ACTORS =================
    STU["Student"]
    PAR["Parent"]
    ADM["Administration"]
    NOTIF["Notification Service"]
    SCHED["Scheduler"]

%% ============== SYSTEM BOUNDARY ==============
    subgraph SYS["EduBridge LMS"]
    direction TB

        UC1(("Login"))
        UC2(("Reset Password"))
        UC3(("Validate Credentials"))

        UC4(("View Dashboard"))
        UC5(("View Study Material"))
        UC6(("Attempt Quiz"))
        UC7(("Evaluate Quiz"))
        UC8(("View Notifications"))
        UC9(("View Own Attendance"))

        UC10(("View Child Attendance"))
        UC11(("View Progress Report"))
        UC12(("Download Report Card"))
        UC13(("View Fee Status"))

        UC14(("Manage Students and Parents"))
        UC15(("Manage Batches"))
        UC16(("Upload Study Material"))
        UC17(("Mark Attendance"))
        UC18(("Create Quiz"))
        UC19(("Enter Marks and Remarks"))
        UC20(("Manage Fee Records"))
        UC21(("Post Notification"))
        UC22(("Send Notification"))
        UC23(("Generate Fee Reminder"))

    end

%% ============ ACTOR ASSOCIATIONS ============
    STU --- UC1
    STU --- UC4
    STU --- UC5
    STU --- UC6
    STU --- UC8
    STU --- UC9

    PAR --- UC1
    PAR --- UC8
    PAR --- UC10
    PAR --- UC11
    PAR --- UC13

    ADM --- UC1
    ADM --- UC14
    ADM --- UC15
    ADM --- UC16
    ADM --- UC17
    ADM --- UC18
    ADM --- UC19
    ADM --- UC20
    ADM --- UC21

    UC22 --- NOTIF
    UC23 --- SCHED

%% ======= INCLUDES (arrow to secondary use case) =======
    UC1  -.->|"&lt;&lt;includes&gt;&gt;"| UC3
    UC6  -.->|"&lt;&lt;includes&gt;&gt;"| UC7
    UC21 -.->|"&lt;&lt;includes&gt;&gt;"| UC22
    UC23 -.->|"&lt;&lt;includes&gt;&gt;"| UC22
    UC19 -.->|"&lt;&lt;includes&gt;&gt;"| UC11

%% ======= EXTENDS (arrow to primary use case) =======
    UC2  -.->|"&lt;&lt;extends&gt;&gt;"| UC1
    UC12 -.->|"&lt;&lt;extends&gt;&gt;"| UC11
```

### Post-import fixes in draw.io (required)

| Element | Action |
|---|---|
| Actors (Student, Parent, Administration, Notification Service, Scheduler) | Select all 5 → right-click → **Edit Style** → replace with `shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;` |
| Use cases | Should already be ellipses. If not: **Edit Style** → `ellipse;whiteSpace=wrap;html=1;` |
| System boundary | Select the `EduBridge LMS` container → `rounded=0;whiteSpace=wrap;html=1;verticalAlign=top;` (plain rectangle, label at top) |
| Association lines | Must have **no arrowheads**. If any appear: `endArrow=none;html=1;` |
| `<<includes>>` / `<<extends>>` | Must be **dashed with open arrowhead**: `endArrow=open;dashed=1;html=1;` |

### Relationship rationale (be ready to explain this in the viva)

- `Login <<includes>> Validate Credentials` — credential validation is common behaviour reused by every login, so it is factored into its own use case (PPT slide 17).
- `Attempt Quiz <<includes>> Evaluate Quiz` — auto-grading always runs as part of a submission.
- `Post Notification <<includes>> Send Notification` and `Generate Fee Reminder <<includes>> Send Notification` — two different use cases share the same delivery behaviour, which is the textbook reason to use `<<includes>>`.
- `Reset Password <<extends>> Login` — optional, only under the condition that the user has forgotten the password (PPT slide 18).
- `Download Report Card <<extends>> View Progress Report` — optional behaviour on top of the base use case.
- **Scheduler** and **Notification Service** are actors of the *"Other system"* category (PPT slide 14) — they are external to EduBridge but interact with it. The Scheduler is what drives automated fee reminders without the teacher initiating them.

---

## 2. Activity Diagram — Login and Role-Based Access

```mermaid
flowchart TB

    START(("&nbsp;"))

    subgraph USER["User"]
    direction TB
        A1["Open EduBridge Application"]
        A2["Enter Credentials"]
        A3["View Error Message"]
    end

    subgraph SYSTEM["System"]
    direction TB
        A4["Validate Credentials"]
        D1{" "}
        A5["Identify User Role"]
        D2{" "}
        M1{" "}
        A6["Load Student Dashboard"]
        A7["Load Parent Dashboard"]
        A8["Load Admin Dashboard"]
        A9["Create Session"]
    end

    END(("&nbsp;"))

    START --> A1
    A1 --> A2
    A2 --> A4
    A4 --> D1
    D1 -->|"[invalid credentials]"| A3
    A3 --> A2
    D1 -->|"[valid credentials]"| A5
    A5 --> D2
    D2 -->|"[role = student]"| A6
    D2 -->|"[role = parent]"| A7
    D2 -->|"[role = administration]"| A8
    A6 --> M1
    A7 --> M1
    A8 --> M1
    M1 --> A9
    A9 --> END
```

**Notation notes for this diagram:**
- `D1` and `D2` are **decision points** — one entry, multiple guarded exits, and the guards `[valid credentials]` / `[invalid credentials]` cover all eventualities (slide 31).
- `M1` is a **merge diamond**, not an activity with three incoming lines. This is the UML2 rule from slide 32 and is the single most common mistake in student diagrams.
- `USER` and `SYSTEM` are **swimlanes/partitions** (slide 35).

**Post-import fixes:**

| Element | Style to apply |
|---|---|
| Start node | `ellipse;fillColor=#000000;strokeColor=#000000;` (solid filled circle) |
| End node | `shape=endState;fillColor=#000000;strokeColor=#000000;` (circle inside circle) |
| Activities | `rounded=1;whiteSpace=wrap;html=1;arcSize=40;` (long rounded rectangle, slide 30) |
| Decision / merge | `rhombus;whiteSpace=wrap;html=1;` — delete the placeholder space so they are empty diamonds |
| Swimlanes | Select each `subgraph` container → `swimlane;horizontal=0;startSize=30;` |

---

## 3. Activity Diagram (Alternative) — Post Notification with Fork / Join

Use this one if you want to demonstrate **fork and join** (slide 33), which the login diagram does not contain. Instructors frequently ask for parallel behaviour, since that is the stated difference between an activity diagram and a flowchart (slide 29).

```mermaid
flowchart TB

    START(("&nbsp;"))

    subgraph ADMIN["Administration"]
    direction TB
        B1["Compose Notification"]
        B2["Select Target Batch"]
        B3["Choose Recipient Group"]
    end

    subgraph SYSTEM["System"]
    direction TB
        D1{" "}
        F1["FORK"]
        B4["Store Notification Record"]
        B5["Push to Student Feed"]
        B6["Push to Parent Feed"]
        J1["JOIN"]
        B7["Update Delivery Status"]
        B8["Show Validation Error"]
    end

    subgraph RECIPIENT["Student / Parent"]
    direction TB
        B9["Receive Notification"]
        B10["Open and Read Notification"]
    end

    END(("&nbsp;"))

    START --> B1
    B1 --> B2
    B2 --> B3
    B3 --> D1
    D1 -->|"[fields incomplete]"| B8
    B8 --> B1
    D1 -->|"[fields valid]"| F1
    F1 --> B4
    F1 --> B5
    F1 --> B6
    B4 --> J1
    B5 --> J1
    B6 --> J1
    J1 --> B7
    B7 --> B9
    B9 --> B10
    B10 --> END
```

**Post-import fix for the fork and join bars:** select `FORK` and `JOIN`, delete their text, and apply
`fillColor=#000000;strokeColor=#000000;html=1;` then resize each to a wide, ~5px tall bar.

The fork means storing the record, pushing to the student feed and pushing to the parent feed all happen concurrently; the join means the delivery status cannot be updated until all three threads have completed.

---

## Checklist before submitting

- [ ] Actors are stickmen, drawn **outside** the system boundary rectangle
- [ ] Every use case is an ellipse **inside** the boundary
- [ ] Association lines have **no arrowheads**
- [ ] `<<includes>>` arrows point **towards the secondary (included)** use case
- [ ] `<<extends>>` arrows point **towards the primary (base)** use case
- [ ] Spelling is `<<includes>>` and `<<extends>>`, not `<<include>>` / `<<extend>>`
- [ ] Every decision diamond has guards on **all** outgoing edges
- [ ] Every decision is closed with a **merge diamond**, not multiple lines into one activity
- [ ] Exactly **one** start node per activity diagram
- [ ] Swimlane names are at the top of each column

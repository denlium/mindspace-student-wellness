

    const $ = s => document.querySelector(s);
    const $$ = s => [...document.querySelectorAll(s)];

    let tasks = [],
        selectedMood = null,
        history = [];

    const moodInfo = {
        1: { emoji: "😣", label: "Low" },
        2: { emoji: "😟", label: "Stressed" },
        3: { emoji: "😐", label: "Okay" },
        4: { emoji: "🙂", label: "Good" },
        5: { emoji: "😄", label: "Great" }
    };

    const titles = {
        home: "A little space to breathe.",
        planner: "Let's make work manageable.",
        support: "You don't have to handle it alone.",
        calm: "Take a moment for yourself.",
        wellbeing: "Your feelings deserve attention."
    };

    function toast(msg) {
        const t = $("#toast");
        t.textContent = msg;
        t.style.display = "block";

        clearTimeout(toast.timer);

        toast.timer = setTimeout(() => {
            t.style.display = "none";
        }, 2500);
    }

    function go(view) {
        $$(".view").forEach(v => {
            v.classList.toggle("active", v.id === view);
        });

        $$(".nav button").forEach(b => {
            b.classList.toggle("active", b.dataset.view === view);
        });

        $("#pageTitle").textContent = titles[view] || titles.home;

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    $$("[data-view]").forEach(b => {
        b.addEventListener("click", () => go(b.dataset.view));
    });

    $$("[data-go]").forEach(b => {
        b.addEventListener("click", () => go(b.dataset.go));
    });

    function selectMood(id, group) {
        selectedMood = id;

        group.querySelectorAll("[data-mood]").forEach(b => {
            b.classList.toggle(
                "selected",
                Number(b.dataset.mood) === id
            );
        });
    }

    $("#homeMoods").querySelectorAll("[data-mood]").forEach(b => {
        b.addEventListener("click", () => {
            selectMood(Number(b.dataset.mood), $("#homeMoods"));
        });
    });

    $("#wellbeingMoods").querySelectorAll("[data-mood]").forEach(b => {
        b.addEventListener("click", () => {
            selectMood(Number(b.dataset.mood), $("#wellbeingMoods"));
        });
    });

    function updateTasks() {
        const open = tasks.filter(t => !t.done);
        const done = tasks.filter(t => t.done);
        const hours = open.reduce((s, t) => s + t.hours, 0);
        const pct = tasks.length
            ? Math.round(done.length / tasks.length * 100)
            : 0;

        $("#taskCount").textContent = tasks.length;
        $("#doneCount").textContent = done.length;
        $("#hoursCount").textContent = hours + "h";
        $("#progressLabel").textContent = pct + "%";
        $("#progressFill").style.width = pct + "%";

        $("#plannerTaskCount").textContent = open.length;
        $("#plannerHours").textContent = hours + "h";
        $("#plannerDone").textContent = done.length;

        const list = $("#taskList");
        list.innerHTML = "";

        if (!tasks.length) {
            list.innerHTML = `
                <div class="empty">
                    No tasks yet. Add one small task to get started.
                </div>
            `;
            return;
        }

        tasks.forEach(t => {
            const row = document.createElement("div");
            row.className = "task" + (t.done ? " done" : "");

            const check = document.createElement("input");
            check.type = "checkbox";
            check.checked = t.done;
            check.setAttribute("aria-label", "Mark " + t.name + " complete");

            check.onchange = () => {
                t.done = check.checked;
                updateTasks();
            };

            const info = document.createElement("div");
            info.className = "task-info";

            const name = document.createElement("div");
            name.className = "task-name";
            name.textContent = t.name;

            const meta = document.createElement("div");
            meta.className = "task-meta";
            meta.textContent =
                (t.date ? "Due " + t.date + " · " : "") +
                t.hours + "h planned";

            info.append(name, meta);

            const pr = document.createElement("span");
            pr.className = "task-priority";
            pr.textContent = t.priority;

            const del = document.createElement("button");
            del.className = "plain";
            del.textContent = "×";
            del.title = "Delete task";

            del.onclick = () => {
                tasks = tasks.filter(x => x.id !== t.id);
                updateTasks();
            };

            row.append(check, info, pr, del);
            list.append(row);
        });
    }

    $("#taskForm").addEventListener("submit", e => {
        e.preventDefault();

        tasks.push({
            id: Date.now(),
            name: $("#taskName").value.trim(),
            date: $("#taskDate").value,
            hours: Number($("#taskHours").value),
            priority: $("#taskPriority").value,
            done: false
        });

        $("#taskName").value = "";

        updateTasks();
        toast("Task added. One step at a time.");
    });

    $("#clearDone").onclick = () => {
        tasks = tasks.filter(t => !t.done);
        updateTasks();
        toast("Completed tasks cleared.");
    };

    function saveCheckin(note = "") {
        if (!selectedMood) {
            toast("Choose a mood first.");
            return;
        }

        const entry = {
            mood: selectedMood,
            source: $("#stressSource")?.value || "",
            note,
            date: new Date().toLocaleDateString(undefined, {
                month: "short",
                day: "numeric"
            })
        };

        history.push(entry);
        renderHistory();
        toast("Check-in saved. Thanks for checking in.");
    }

    $("#saveMoodHome").onclick = () => {
        if (!selectedMood) {
            toast("Choose a mood first.");
            return;
        }

        history.push({
            mood: selectedMood,
            source: "",
            note: "",
            date: new Date().toLocaleDateString(undefined, {
                month: "short",
                day: "numeric"
            })
        });

        renderHistory();
        toast("Check-in saved.");
    };

    $("#saveWellbeing").onclick = () => {
        if (!selectedMood) {
            toast("Choose a mood first.");
            return;
        }

        saveCheckin($("#journalNote").value.trim());
        $("#journalNote").value = "";
    };

    function renderHistory() {
        const bars = $("#historyBars");
        const list = $("#reflectionList");

        bars.innerHTML = "";
        list.innerHTML = "";

        if (!history.length) {
            bars.innerHTML = `
                <div class="empty" style="width: 100%">
                    Your saved check-ins will appear here.
                </div>
            `;
            return;
        }

        history.slice(-7).forEach(h => {
            const wrap = document.createElement("div");
            wrap.className = "bar-wrap";

            const bar = document.createElement("div");
            bar.className = "bar";
            bar.style.height = (h.mood * 18) + "px";
            bar.title = moodInfo[h.mood].label;

            const day = document.createElement("span");
            day.textContent = h.date;

            wrap.append(bar, day);
            bars.append(wrap);
        });

        history.slice(-3).reverse().forEach(h => {
            const div = document.createElement("div");
            div.className = "task";

            const icon = document.createElement("span");
            icon.style.fontSize = "22px";
            icon.textContent = moodInfo[h.mood].emoji;

            const info = document.createElement("div");
            info.className = "task-info";

            const title = document.createElement("div");
            title.className = "task-name";
            title.textContent = h.date + " · " + moodInfo[h.mood].label;

            const sub = document.createElement("div");
            sub.className = "task-meta";
            sub.textContent = [
                h.source && h.source !== "Choose one" ? h.source : "",
                h.note
            ].filter(Boolean).join(" — ") || "No note added";

            info.append(title, sub);
            div.append(icon, info);
            list.append(div);
        });
    }

    const chatbox = $("#chatbox");

    function addBubble(text, type) {
        const d = document.createElement("div");
        d.className = "bubble " + type;
        d.textContent = text;

        chatbox.append(d);
        chatbox.scrollTop = chatbox.scrollHeight;
    }

    function replyFor(message) {
        const m = message.toLowerCase();

        if (/fail|exam|marks|test|result/.test(m)) {
            return "Exam pressure can feel huge. Let's make it more specific: what is one subject or topic you could revise for just 20 minutes? A small start is still progress.";
        }

        if (/work|assignment|deadline|too much|overwhelm|busy/.test(m)) {
            return "That sounds like a lot to carry. Write down everything due, then choose one urgent and manageable task. We can organise it together in Study Rescue.";
        }

        if (/compare|behind|everyone|friends|better than/.test(m)) {
            return "It's easy to compare your behind-the-scenes with someone else's highlights. Your pace is allowed to be different. What is one thing you need for your own progress today?";
        }

        if (/lonely|alone|friend|nobody|relationship/.test(m)) {
            return "I'm sorry this feels lonely. You deserve support from real people, too. Is there a friend, family member, teacher or counsellor you could safely reach out to today?";
        }

        if (/sleep|tired|exhaust/.test(m)) {
            return "Being tired can make everything feel harder. If you can, take a short pause, drink some water, and protect your sleep tonight. What can wait until tomorrow?";
        }

        if (/don't know|dont know|not sure|nothing/.test(m)) {
            return "That's okay. You don't need to have the perfect words. Try naming just one thing you notice right now—tension, tiredness, worry, or something else.";
        }

        return "Thank you for sharing that with me. It makes sense to take this one step at a time. What feels most helpful right now: talking it through, taking a calming break, or making a practical plan?";
    }

    function sendMessage(msg) {
        if (!msg.trim()) return;

        addBubble(msg.trim(), "user");
        addBubble(replyFor(msg), "bot");

        $("#chatMessage").value = "";
    }

    $("#chatForm").addEventListener("submit", e => {
        e.preventDefault();
        sendMessage($("#chatMessage").value);
    });

    $$("[data-prompt]").forEach(b => {
        b.onclick = () => sendMessage(b.dataset.prompt);
    });

    let breathTimer = null;
    let breathStep = 0;
    let breathRounds = 0;

    const phases = [
        ["Breathe in", 4],
        ["Breathe out", 6]
    ];

    function stopBreathing() {
        clearInterval(breathTimer);
        breathTimer = null;

        $("#breathCircle").classList.remove("running");
        $("#breathText").innerHTML = "Ready<br><small>when you are</small>";
        $("#breathStatus").textContent =
            "Try 4 slow rounds at your own pace.";
        $("#breathButton").textContent = "Start breathing";
    }

    function startBreathing() {
        if (breathTimer) {
            stopBreathing();
            return;
        }

        breathStep = 0;
        breathRounds = 0;

        $("#breathCircle").classList.add("running");
        $("#breathButton").textContent = "Restart";

        let remaining = 4;

        const tick = () => {
            const phase = phases[breathStep];

            $("#breathText").innerHTML =
                phase[0] + "<br><small>" + remaining + " seconds</small>";

            $("#breathStatus").textContent =
                "Round " + (breathRounds + 1) +
                " of 4 · keep it gentle";

            remaining--;

            if (remaining < 0) {
                if (breathStep === 0) {
                    breathStep = 1;
                    remaining = 6;
                } else {
                    breathStep = 0;
                    breathRounds++;
                    remaining = 4;

                    if (breathRounds >= 4) {
                        stopBreathing();

                        $("#breathStatus").textContent =
                            "You made time for yourself. Notice how you feel.";

                        toast("Breathing break complete.");
                        return;
                    }
                }
            }
        };

        tick();
        breathTimer = setInterval(tick, 1000);
    }

    $("#breathButton").onclick = startBreathing;
    $("#breathStop").onclick = stopBreathing;

    $("#resetGrounding").onclick = () => {
        $$("#groundingSteps input").forEach(x => {
            x.checked = false;
        });

        toast("Grounding exercise reset.");
    };

    const reminders = [
        "Your worth is not a productivity score.",
        "Rest is part of learning, not a reward you must earn.",
        "You only need to take the next step, not every step.",
        "Progress can be quiet and still be real.",
        "You are allowed to ask for help."
    ];

    $("#newReminder").onclick = () => {
        $("#reminderText").textContent =
            reminders[Math.floor(Math.random() * reminders.length)];
    };

    $("#todayText").textContent =
        "A calm place to check in, plan and take your next small step.";

    updateTasks();
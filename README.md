# Question timer

A per-question timer shown just above the prompt bar, for timed TMUA practice. Start, pause and resume the clock, press Next question to log the time and start the next one, and Reset to clear everything. The time turns amber at 3:00 and red past the 3:45 target, with a toast when you go over. A summary line shows your last time, your average and how many went over.

## Install

At the prompt of a Claude Code session:

```
/plugin install question-timer --marketplace 21louisevans-hue/question-timer
```

Answer `y` to add the marketplace, then pick a scope. From a shell:

```
claude plugin install question-timer --marketplace 21louisevans-hue/question-timer
```

## Controls

- `s` Start / Pause / Resume
- `n` Next question (logs the time and starts the next one)
- `r` Reset

Shows on the terminal and the desktop app.

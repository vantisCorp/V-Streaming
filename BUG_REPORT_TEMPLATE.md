# V-Streaming - Bug Report Template

## Bug Report

**Title**: [Brief, descriptive title of the bug]

**Severity**: [Critical/High/Medium/Low]

**Priority**: [P1/P2/P3/P4]

**Status**: [New/In Progress/Resolved/Cannot Reproduce]

**Tester ID**: [Your tester ID]

**Date Reported**: [YYYY-MM-DD]

**Last Updated**: [YYYY-MM-DD]

---

## Description

Provide a detailed description of the bug:

- What is the bug?
- When does it occur?
- How does it affect the application?
- Is it reproducible or intermittent?

---

## Steps to Reproduce

Provide clear, step-by-step instructions to reproduce the bug:

1. [Step 1]
2. [Step 2]
3. [Step 3]
4. [Step 4]
5. [Step 5]

**Expected Behavior**: [What should happen]

**Actual Behavior**: [What actually happens]

---

## Environment

### System Information
- **OS**: [Windows 10/11, version]
- **OS Build**: [Build number]
- **CPU**: [Processor model and cores]
- **GPU**: [Graphics card model]
- **GPU Driver**: [Driver version]
- **RAM**: [Amount of RAM]
- **Disk Space**: [Available disk space]
- **Display**: [Resolution and refresh rate]

### V-Streaming Information
- **Version**: [Beta version number]
- **Build Date**: [Build date]
- **Interface Mode**: [Simple/Expert]
- **Installation Type**: [Installer/Portable]

### Streaming Configuration
- **Platform**: [Twitch/YouTube/Kick/Other]
- **Bitrate**: [kbps]
- **Resolution**: [e.g., 1080p, 720p]
- **Frame Rate**: [e.g., 30fps, 60fps]
- **Encoder**: [NVENC/AMF/QuickSync/Software]
- **Codec**: [H.264/H.265/AV1]

---

## Screenshots / Videos

Attach screenshots or screen recordings showing the bug:

- [Screenshot 1 description]
- [Screenshot 2 description]
- [Video link if applicable]

---

## Logs

Attach relevant log files:

- **Application Log**: [Attach log file]
- **Crash Dump**: [If applicable]
- **Performance Log**: [If applicable]

**How to find logs**:
1. Go to `C:\Users\[Username]\AppData\Roaming\V-Streaming\logs\`
2. Find the most recent log file
3. Attach to this bug report

---

## Frequency

How often does this bug occur?

- [ ] Always (100% of the time)
- [ ] Often (50-99% of the time)
- [ ] Sometimes (10-49% of the time)
- [ ] Rarely (1-9% of the time)
- [ ] Once (only happened once)

---

## Workaround

If you found a workaround, describe it here:

[Describe any temporary solutions or workarounds]

---

## Impact

How does this bug affect your streaming experience?

- [ ] Completely blocks streaming
- [ ] Major inconvenience, but can still stream
- [ ] Minor inconvenience
- [ ] Cosmetic issue only
- [ ] No impact on streaming

---

## Additional Context

Add any other context about the problem:

- [Any additional information]
- [Related bugs or issues]
- [Things you tried that didn't work]
- [Any other relevant details]

---

## Severity Guidelines

### Critical
- Application crashes or freezes
- Data loss or corruption
- Security vulnerability
- Streaming completely broken
- Cannot use the application at all

### High
- Major feature completely broken
- Significant performance degradation
- Frequent crashes or instability
- Cannot complete core workflows

### Medium
- Minor feature broken
- Occasional performance issues
- UI glitches that affect usability
- Workaround available but inconvenient

### Low
- Cosmetic issues only
- Typos or text errors
- Minor inconveniences
- Does not affect functionality

---

## Priority Guidelines

### P1 - Critical
- Must be fixed before launch
- Blocks core functionality
- Affects many users

### P2 - High
- Should be fixed before launch
- Important feature broken
- Affects significant number of users

### P3 - Medium
- Fix if time permits
- Minor feature broken
- Affects small number of users

### P4 - Low
- Nice to have
- Cosmetic issues
- Can be deferred

---

## Example Bug Report

### Title: Application crashes when switching to VTuber mode

**Severity**: High  
**Priority**: P2  
**Tester ID**: TESTER-001  
**Date Reported**: 2025-03-02

### Description
When switching from regular streaming mode to VTuber mode, the application crashes with an error message about missing webcam access.

### Steps to Reproduce
1. Launch V-Streaming
2. Start a regular stream
3. Click on VTuber tab
4. Load a .VRM model
5. Click "Enable Face Tracking"
6. Application crashes

**Expected Behavior**: Face tracking should enable without crashing

**Actual Behavior**: Application crashes with error: "Webcam access denied"

### Environment
- **OS**: Windows 11 Pro, Build 22621
- **CPU**: Intel Core i7-12700K
- **GPU**: NVIDIA RTX 3080
- **RAM**: 32GB
- **V-Streaming Version**: Beta 1.0.0
- **Interface Mode**: Expert

### Frequency
- Always (100% of the time)

### Workaround
Grant webcam access in Windows privacy settings before enabling face tracking

### Impact
Major inconvenience - cannot use VTuber features without workaround

---

## Submission

Once you've completed this bug report:

1. Save this file as `BUG-[Title]-[Date].md`
2. Attach any screenshots, videos, or log files
3. Submit to the beta testing Discord channel
4. Post in the #bug-reports channel with the bug title

**Thank you for helping improve V-Streaming! 🐛**
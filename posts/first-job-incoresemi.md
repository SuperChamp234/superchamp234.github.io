---
title: I started working at InCore Semiconductors
layout: post
date: 2025-12-04T12:37:53.328Z
tags:
  - blog
  - work
  - incoresemi
---

After a long and exhausting job search, I finally joined InCore Semiconductors three months ago! So far, the experience here has been amazing, the folks here are challenging every aspect of classical semiconductor design, and I'm learning a lot. My position is of a verification engineer, working on the software for all their verification setup. Here, these folks have identified that the verification process is sluggish in big orgs, and have developed tools to combat this! I'll be talking about one of these tools here, eUVM!

## eUVM

[eUVM](https://github.com/coverify/euvm) is a D port of IEEE standard 1800.2 2020-1.0 UVM (Universal Verification Methodology). It is powered by ESDL, a simulation engine made in D which harnesses the power of verilator, or any commercial sim like Questa, and allows for writing testbenches in eUVM and simulate them in a platform-agnostic way.

This allows for stuff like validating testbenches and getting functional coverage fast on verilator (verilator cannot do functional coverage, but with ESDL it can!), and once ready for production / shipping to a client, getting some "commercially accepted" reports by running the same testbench on Questa.

I remember looking at the missing SV features in verilator, and wanting to contribute when I was unemployed (alas verilator is very complex project), seeing ESDL and EUVM tackle all those missing features makes me very excited to delve into their inner workings.

## RiVer Core

RiVer Core is a RISC-V verification platform, which ties a bunch test-generation utilities, runs them on a bunch of DUTs (can be commercial simulators, multiple DUTs..) and compares results by running same tests on reference designs. Currently a part of my work is improving the codebase, and adding new features (like a TUI powered by textual!).

## Where does this go?

You might wonder that this is quite a pivot from actual comparch? And I agree, but this feels more like a preface to getting into more comparch. I chat with the design engineers here and I get to learn a lot about what their pain points are, and while fishing for bugs in the hardware, I get to see how exactly everything falls into place (also learn bluespec!).

That's all for now, this was just a minor update. See you folks later!
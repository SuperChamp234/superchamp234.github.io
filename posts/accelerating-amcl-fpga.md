---
title: FPGA Acceleration of Likelihood Model based Adaptive Monte-Carlo Localization
date: 2024-06-17T10:56:40.093Z
tags:
  - projects
---

Adaptive Monte Carlo Localization (AMCL) is a widely used algorithm in robotics for estimating a robot’s position within its environment. It relies on a probabilistic approach, utilizing a set of particles to represent different pose hypotheses. However, AMCL's computational demands make real-time execution challenging, especially on embedded systems.

In this project, I explored FPGA acceleration to improve the efficiency of AMCL’s particle filtering algorithm, particularly the likelihood model-based weight computation. The goal was to achieve better performance while ensuring compatibility with the ROS 2 framework.

## The Problem

AMCL's computational complexity arises from continuously updating particle weights based on sensor data. This process involves:

- Simulating sensor readings for each particle

- Computing likelihood weights by comparing simulated and actual sensor data

- Resampling particles based on computed weights

On embedded platforms, such as those used in mobile robots, CPU-based execution often fails to meet real-time constraints. To overcome this, hardware acceleration using FPGAs offers a promising solution by leveraging parallelism and pipelining techniques.

To accelerate AMCL, I implemented a pipelined architecture for likelihood-based weight computation on the Kria KV260 FPGA platform. Using High-Level Synthesis (HLS), I designed a hardware kernel optimized for:

- Efficient parallel execution of likelihood computations

- Reducing memory bottlenecks via optimized data flow and buffering

- Seamless integration with ROS 2 through the Robotcore framework.

## Results

Benchmarking the FPGA implementation against a CPU-based version of AMCL revealed a significant performance boost:

- 1.6x improvement in execution time compared to CPU execution

- 1.95x increase in processing frequency, leading to faster updates in real-time scenarios

These results indicate that FPGA acceleration can enhance real-time performance for robotics localization tasks, making it a viable option for embedded systems with strict computational constraints.


## My experience with HLS

This project was by far my most extensive experience with High-Level Synthesis (HLS). I found it to be a powerful tool for designing custom hardware accelerators, especially for computationally intensive tasks like AMCL. HLS allowed me to:

- Easily interface with the Zynq SoC on the Kria KV260 platform, abstracting all hardware details like AXI for communication with memory and passing data to the FPGA, allowing me to focus on algorithm design.
- Resource utilization and performance optimization were crucial for achieving real-time performance. HLS provided detailed reports on resource usage, latency, and throughput, enabling me to fine-tune the design for maximum efficiency. While it is possible to get better resource utilization by writing RTL code directly, HLS significantly reduced development time and made the design more maintainable.

Of course, no technology is perfect. Here are some of the pain points I encountered while using HLS:

- AMD Documentation: Okay, I have to admit that AMD has maintained their docs in a very neat way compared to some of their competitors. However, some more examples or descriptions of exact behaviors would have been helpful. I had to rely on the community forums for some of the more complex issues I faced. Also, why does the IDE guidance point to links that are not a part of the official documentation? That was a bit weird. Those guidance messages were crucial in kernel development, but a very limited explanation on what exactly was going wrong, with no pointers in the official documentation, made it a bit frustrating. For me the official documentation I followed the most was UG1399 for HLS.
- Debugging: Debugging HLS kernels is not as straightforward as debugging software code. While the HLS IDE provides some simulation capabilities, debugging complex kernels can be challenging. I had to rely on print statements and waveform analysis to identify issues, which was time-consuming. Nevertheless, I would have required a full team to debug the RTL code, so I am not complaining much about this.
- Over-abstracting: While HLS abstracts the hardware details, it can sometimes lead to performance bottlenecks due to suboptimal RTL implementations that clearly have a solution to but are not mentioned in the documentation. This can be frustrating, especially when you know that a small change in the code can lead to a significant performance improvement.

All in all, it was a fun experience. I loved the ability to prototype designs with ease, however RTL code is still the way to go for more complex designs. I’d love to see an RTL workflow that is as streamlined as HLS for initial kernel setup.

## Read the whole thing

If you are interested in the details of the implementation, the design choices, and the results, you can read the full paper [here](https://drive.google.com/file/d/1zK9jAKZ9oBVwV1-_GcFWSXyqZOX0cpnZ/view?usp=drive_link). Feel free to reach out to me if you have any questions or suggestions regarding the project. I am always open to feedback and discussions. Thanks to the team at Acceleration Robotics for their support and guidance throughout this project.
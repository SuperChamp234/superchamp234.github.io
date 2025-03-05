---
title: Accelerating Sparse Matrix Multiplication on FPGAs
date: 2023-08-28T12:37:53.328Z
tags:
  - projects
---

Sparse matrix multiplication (SpGEMM) is a fundamental operation in scientific computing, graph analytics, and machine learning. However, its irregular memory access patterns and high computational complexity make it challenging to accelerate efficiently. In this project, I explored FPGA-based acceleration for SpGEMM using High-Level Synthesis (HLS), focusing on different dataflows and sparse storage formats to optimize performance.

Sparse matrix multiplications differ from dense operations due to the need to handle zero values efficiently. The major challenges include:

- Memory Bottlenecks: Storing and accessing sparse data without excessive overhead.

- Parallelization Issues: Exploiting FPGA parallelism despite the irregularity of sparse data.

- Storage Format Efficiency: Choosing between formats like Compressed Sparse Row (CSR) and Compressed Sparse Column (CSC) to optimize access patterns.

To address these challenges, I implemented and compared multiple SpGEMM dataflows on an FPGA:

- Inner Product Dataflow: Computes the dot product of corresponding rows and columns but suffers from low parallelism.

- Outer Product Dataflow: Generates partial results for each outer product but requires significant on-chip memory.

- Row-based Dataflow: Optimizes memory access but can limit computation throughput.

I implemented SpGEMM on an FPGA using Vivado HLS, targeting the Xilinx Arty A7 board. While the implementation showed promising potential, a few challenges arose. There was an issue with understanding how the AXI master interface works, leading to incorrect mem access. This was my first HLS project, but since the Arty A7 lacked an SoC, it was not possible to run a full application on the FPGA.

For a deeper dive into the design, implementation, and challenges, check out the full paper [here](https://drive.google.com/file/d/1_hl6ta7lshTdV9dNm-zLNECsfylJ96QZ/view?usp=drive_link). If you have any insights or suggestions, feel free to reach out—I’d love to discuss optimizations for sparse computations on FPGAs!
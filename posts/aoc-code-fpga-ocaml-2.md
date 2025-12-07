---
title: AOC 2025 Part 2 - OCaml Boogaloo
layout: post
date: 2025-12-08T13:37:53.328Z
tags:
  - blog
  - aoc
  - ocaml
---

Continuing with the last post, I'll be discussing my experience with OCaml and solving rest of the AOC problems till day 4.

## Day 3

Stack! I immediately recognized this leetcode problem haha, finding the largest number possible lexicographically from a stack of numbers. However, I was unable to imagine how a stack would be implemented in OCaml. I ended up using the Std Stack, but in retrospect, writing my own OCaml stack would have been a better learning approach.

```ocaml
let find_n_batteries n arr =
  let len = List.length arr in
  if len = 0 || n <= 0 then 0
  else
    let n = if n > len then len else n in
    let drop = len - n in
    let stack = Stack.create () in

    (* Keep stacking, and remove batteries which cannot contribute to a larger number *)
    let rec loop rem = function
      | [] -> rem
      | x :: xs ->
          let rec pop_while r =
            if r > 0 && (not (Stack.is_empty stack)) && Stack.top stack < x then (
              ignore (Stack.pop stack);
              pop_while (r - 1))
            else r
          in
          let rem' = pop_while rem in
          Stack.push x stack;
          loop rem' xs
    in

    let rem_after = loop drop arr in

(* Rest of the code to drop the extra batteries *)
(* ... *)
```

As an electrical engineer, finding the exact joltage value to save christmas and making everything jolly was a great time. I was initially very lost trying to write a recursive function which would deal with the stack, and I kept making a lot of mistakes around the line `ignore (Stack.pop stack);` because I was not sure if I can just call a `Unit` returning method and discard the result! I think I can even remove the ignore keyword now... since I did not use that in the following day.

## Day 4

This day was much easier than I thought, and this was another day where I learnt a new OCaml thing and fought with it. 2D arrays! Apparently, there's different `Arrays` and `Lists` in OCaml, with the former having many helper methods which made writing this solution much easier.

```ocaml
for i = start_i to end_i do
      for j = start_j to end_j do
        if inp.(i).(j) = 1 then
          let v = score i j inp in
          if v < 4 then (
            ans := !ans + 1;
            sel_elems := !sel_elems @ [(i,j)];
          )
      done
    done;
```

I spent an hour trying to write this for loop as a recursive function. After a while and many errors where it exepcted a `` a` list list`` somehow.

My two ways of debugging an OCaml program, or coming up with the approach would be to first modularise my approach, try to write all helper methods in my editor, copy paste them into `utop` and then write the main function which solved the problem.

The VS-Code extension for OCaml has these neat inline inference of types, which was one of my main methods of knowing if I was writing correct syntax haha.

Day 4 part 2 could have been made a little more hard, but I guess they're keeping the best for next.

## Day 5

Man I think I should build this freshness system for myself. I wonder how the elfs manage that freshness ID range list in the first place. This would make managing my own fridge a lot easier haha.

Anyways, I first thought I should try this with Hashtables, however it struck me that we are dealing with simple ranges here and that would be really clunky. Simply merging the ranges and checking against them felt easier. And lo and behold, the second part of the problem depended on simply enumerating the merged ranges!

```ocaml
let merge_ranges ranges =
  let sorted = List.sort (fun (a, _) (b, _) -> compare a b) ranges in
  let rec aux acc = function
    | [] -> List.rev acc
    | (s, e) :: rest -> (
        match acc with
        | [] -> aux [ (s, e) ] rest
        | (ps, pe) :: t ->
            if s <= pe + 1 then aux ((ps, max pe e) :: t) rest
            else aux ((s, e) :: acc) rest)
  in
  aux [] sorted
```

## Moving setup to Dune!

Having a look at all OCaml resources online, I was motivated to move my setup to Dune. The testing functionality is pretty neat and now I don't have dirty asserts in my code. And I can maintain the utils in a separate file and import them in the test files!

# Finally

As always, you can find my solutions on my [github](https://github.com/SuperChamp234/aoc-2025.git). I hope to catch up with the rest two remaining days tomorrow!
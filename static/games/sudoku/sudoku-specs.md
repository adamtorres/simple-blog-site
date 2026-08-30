# Goal

Create a complete, playable Sudoku game as an html file potentially with supporting files. 

# Sudoku-specific Requirements
* Playable when hosted through an iframe
* Standard grid of 9x9.
* Allow some mechanism to tag individual cells with 'tiny numbers'.
    * These are numbers that mean something to the user but are not validated by any game logic.
    * some way to clear all tiny numbers, clear just a row or column, clear a 9 cell square.
* A toggleable setting that will highlight incorrect numbers.
* Difficulty settings for easy, medium, hard.
* A starting grid has to have exactly one solution.
    * See `Common Uniqueness Patterns` section for a brief explanation.

# Generic Gameplay
* Once a game has ended allow the user to start a new one or quit.
    * quitting takes the user to the game list page.
* Allow the user to pause and resume the game by pressing "P".
    * When the game is paused, blur the grid.
* Has simple blip/bloop style sound effects which can be muted.
* Include the keys and actions to the side in a short legend.
* Keep all new files in the same folder as the specs.
* Split the code into multiple files to help with file size and organization.
* The game should be playable on mobile and desktop devices.
* Try to keep function size small and focused on a specific task.
    * task-focused functions should make testing and debugging easier.

# Questions
* Is there a standard way to generate sudoku game starting positions?
    * Working backwards seems to mostly work to fill a board but randomly removing numbers can lead to multiple solutions. See the `Common Uniqueness Patterns` section for more.


# Common Uniqueness Patterns

The initial grid with the provided numbers must have exactly one solution.

**Unique Rectangle (UR)**: Occurs when the exact same two candidates (e.g., 4 and 7) occupy four cells spanning two rows, two columns, and two 3×3 boxes. If all four cells contain only those two numbers, you could swap them in opposite corners to form two valid solutions.

In the following example board, the four empty cells can be 6 and 8 in both squares.  The middle row of the top left square could be `638` and the top row of the 9 o'clock square would be `816`.  The 6 and 8 in each square could be swapped and the solution would still work.
```
|175|839|426|
| 3 |274|915|
|429|651|378|
|---|---|---|
| 1 |395|742|
|547|162|839|
|293|487|651|
|---|---|---|
|754|926|183|
|981|543|267|
|362|718|594|
```
To avoid this case, the starting layout could include one of those four cells.  That way, there is exactly one value for the remaining three cells.

**Type 1 Uniqueness**: If three cells in a potential Unique Rectangle share a bare pair of candidates, but the fourth cell contains those two candidates plus extra numbers, you must eliminate the pair from that fourth cell. Leaving the pair there would trigger a multi-solution trap.

**Bivalue Universal Grave (BUG)**: A late-stage scenario where every remaining unsolved cell contains exactly two candidates. If filling a specific cell with one candidate leaves the grid with only two possible solutions everywhere else, that candidate must be wrong.
Similar to the uniqueness rectangle.  End result is with the current empty cells, there are multiple solutions.

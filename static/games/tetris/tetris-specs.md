Create a complete, playable Tetris game in a single html file named `tetris.html`. 
Requirements:
* playable when hosted through an iframe
* playing grid of 10 columns and 20 rows
* use the standard tetris piece shapes of I, J, L, O, S, T, Z
* prevent pieces from clipping outside the grid
* use the arrow keys for piece movement with up being rotate
* when the spacebar is pressed, drop the current piece without waiting.
    * Perhaps a very minor delay for the drop animation so the user can see the piece drop rather than it just appearing at the bottom.
* when a horizontal line is completed, remove it
* keep score for successfully placed pieces with a value of 1 for each cell of the newly placed piece
* when a horizontal line is completed, add a bonus score of 100 for 1 line, 200 for 2 lines, 400 for 3 lines, and 800 for 4 lines
* when a horizontal line is completed, move all cells above it down to fill the cleared lines.
* use 7 different colors for the pieces.  Pick a random color for each new piece. Use cheerful colors.
* allow the speed of the piece dropping to be configured as a variable in the script.
* end the game when the new piece cannot be added to the grid without overlapping an existing cell.
* Once a game has ended allow the user to start a new one or quit.
* Allow the user to pause and resume the game by pressing "P"
* Has simple blip/bloop style sound effects which can be muted.
* Include the keys and actions to the side in a short legend.
* Keep all files in the same folder as the specs.
* You can split the code into multiple files to help with file size and organization.
* The game should be playable on mobile and desktop devices.

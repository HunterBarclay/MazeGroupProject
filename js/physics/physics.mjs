/**
 * Generate a contact between 2 squares because omfg why is a circle and a square so hard
 * 
 * @param {[Number, Number]} playerPosition Top-down Position of the player
 * @param {Number} playerHalfSize Radius of Player's collider
 * @param {[Number, Number]} squarePosition Top-down Position of the Wall piece
 * @param {Number} squareHalfSize Half the side length of the wall collider
 * 
 * @return {[Number, Number, Number]?} Contact normal. Null if no collision. This one is in 3 dimensions
 */
export function generateContact(playerPosition, playerHalfSize, squarePosition, squareHalfSize) {
    const [diffX, diffZ] = [Math.abs(squarePosition[0] - playerPosition[0]), Math.abs(squarePosition[1] - playerPosition[1])];
    const [signX, signZ] = [Math.sign(squarePosition[0] - playerPosition[0]), Math.sign(squarePosition[1] - playerPosition[1])];

    const nearX = diffX <= playerHalfSize + squareHalfSize;
    const nearY = diffZ <= playerHalfSize + squareHalfSize;

    if (nearX && nearY) {
        // const ratioX = Math.atan2(squareHalfSize, squareHalfSize + playerRadius);
        // const ratioY = Math.atan2(squareHalfSize + playerRadius, squareHalfSize);
        const ratioX = Math.PI / 4.0;

        const ratio = Math.atan2(diffZ, diffX);

        if (ratio <= ratioX) {
            return [signX * ((squareHalfSize + playerHalfSize) - diffX), 0.0, 0.0];
        } else {
            return [0.0, 0.0, signZ * ((squareHalfSize + playerHalfSize) - diffZ)];
        }
    }
    
    return null;
}
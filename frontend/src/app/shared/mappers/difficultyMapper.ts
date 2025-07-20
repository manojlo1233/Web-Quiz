export abstract class DifficultyMapper {

    private static difficulty = new Map<number, string >([
       [1, 'Easy'],
       [2, 'Medium'],
       [3, 'Hard']
    ]);

    public static getDifficulty(num: number): string {
        return this.difficulty.get(num);
    }

}
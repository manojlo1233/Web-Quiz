export abstract class DifficultyMapper {

    private static difficulty = new Map<number, string >([
       [0, 'Easy'],
       [1, 'Medium'],
       [2, 'Hard']
    ]);

    public static getDifficulty(num: number): string {
        return this.difficulty.get(num);
    }

}
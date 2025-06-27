export abstract class BattleStatusMapper {
    private static status = new Map<string, number >([
       ['waiting', 0],
       ['ready', 1],
       ['started', 2],
       ['cancelled', 3],
       ['finished', 4],
    ]);

    public static getBattleStatus(s: string): number {
        return this.status.get(s) || 4;
    }
}
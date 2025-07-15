export class QuizAnswer {
    id: number;
    text: string;
    isCorrect: boolean;
    isDisabled: boolean;

    constructor(id: number, text: string, isCorrect: boolean) {
        this.id = id;
        this.text = text;
        this.isCorrect = isCorrect;
        this.isDisabled = false;
    }
}
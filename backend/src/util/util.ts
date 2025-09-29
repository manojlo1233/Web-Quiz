export function clearIntervalFromMap(map: Map<string, NodeJS.Timeout>, key: string) {
    if (map.has(key)) {
        clearInterval(map.get(key));
    }
}


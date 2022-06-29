import { invoke } from '@tauri-apps/api/tauri';
import { ICompletion } from '../app/CompletionList';

export function simpleCommandWithResult(
  cardId: string,
  argument: string
): Promise<string> {
  return invoke('simple_command_with_result', {
    cardId: cardId,
    argument: argument,
  });
}

export function complete({
  argument,
  position,
}: {
  argument: string;
  position: number;
}): Promise<ICompletion[]> {
  return invoke('complete', {
    argument,
    position,
  });
}

export function getWorkingDirectory(): Promise<string> {
  return invoke('get_working_directory');
}

export function dropFromCache(cardId: string): Promise<void> {
  return invoke('drop_card_from_cache', { cardId });
}

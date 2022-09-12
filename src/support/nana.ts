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

export function sortCardOutput(
  cardId: string,
  sortColumn: string,
  ascending = true
): Promise<string> {
  return invoke('sort_card', { cardId, sortColumn, ascending });
}

export function copyCardToClipboard(cardId: string): Promise<void> {
  return invoke('copy_card_to_clipboard', { cardId });
}

export function saveCardToFile(
  cardId: string,
  format: string,
  filePath: string
): Promise<void> {
  return invoke('save_card', { cardId, format, filePath });
}

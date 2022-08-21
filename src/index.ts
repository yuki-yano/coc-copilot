import {
  CompleteOption,
  CompleteResult,
  events,
  ExtensionContext,
  sources,
  VimCompleteItem,
  workspace,
} from 'coc.nvim';

type Copilot = {
  suggestions: Array<{
    displayText: string;
    position: { character: number; line: number };
    range: { start: { character: number; line: number }; end: { character: number; line: number } };
    text: string;
    uuid: string;
  }>;
};

const sourceName = 'copilot';

export const activate = async (context: ExtensionContext): Promise<void> => {
  context.subscriptions.push(
    sources.createSource({
      name: sourceName,
      shortcut: 'copilot',
      doComplete: async (option) => {
        const result = await getCompletionItems(option);
        return result;
      },
    })
  );

  events.on('CompleteDone', async (item: VimCompleteItem) => {
    if (item.source !== sourceName) {
      return;
    }

    const firstLine = item.user_data?.split('\n')[0];
    const currentLine = (await workspace.nvim.call('getline', ['.'])) as string;
    if (currentLine !== firstLine) {
      return;
    }

    const lines = item.user_data?.split('\n');
    if (lines != null && lines[1] != null) {
      const lnum = (await workspace.nvim.call('line', ['.'])) as number;
      const appendLines = lines.slice(1);
      await workspace.nvim.call('append', [lnum, appendLines]);
      await workspace.nvim.call('setpos', ['.', [0, lnum + appendLines.length, appendLines.slice(-1)[0].length + 1]]);
    }
  });
};

const getCompletionItems = async (option: CompleteOption): Promise<CompleteResult> => {
  const buffer = workspace.nvim.createBuffer(option.bufnr);
  const copilot = (await buffer.getVar('_copilot')) as Copilot | null;
  const filetype = (await workspace.nvim.call('getbufvar', ['', '&filetype'])) as string;

  if (copilot?.suggestions == null) {
    return {
      items: [],
    };
  }

  return {
    items: copilot.suggestions.map(({ text }) => {
      const match = /^(?<indent>\s*).+/.exec(text);
      const indent = match?.groups?.indent;

      let info: string;
      if (indent != null) {
        info = text
          .split('\n')
          .map((line) => line.slice(indent.length))
          .join('\n');
      } else {
        info = text;
      }

      return {
        kind: ' ',
        word: text.split('\n')[0].slice(option.col),
        info,
        user_data: text,
        dup: 1,
        empty: 1,
        documentation: [{ filetype, content: info }],
      };
    }),
    priority: 1000,
  };
};

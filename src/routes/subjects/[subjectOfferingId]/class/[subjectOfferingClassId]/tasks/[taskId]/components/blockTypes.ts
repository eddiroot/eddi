import type { taskStatusEnum } from '$lib/enums';
import type { ViewMode } from '../constants';
import type {
	BlockHeadingConfig,
	BlockRichTextConfig,
	BlockChoiceConfig,
	BlockFillBlankConfig,
	BlockMatchingConfig,
	BlockShortAnswerConfig,
	BlockWhiteboardConfig
} from '$lib/server/schema/taskSchema';
import type { UpdateBlockResponse } from '../../../../../../../api/tasks/types';
import type { ClassTaskBlockResponse } from '$lib/server/db/schema';

// Union type for all possible block configs
export type BlockConfig =
	| BlockHeadingConfig
	| BlockRichTextConfig
	| BlockChoiceConfig
	| BlockFillBlankConfig
	| BlockMatchingConfig
	| BlockShortAnswerConfig
	| BlockWhiteboardConfig;

export type BlockProps<T extends BlockConfig = BlockConfig> = {
	initialConfig: T;
	onConfigUpdate: (config: T) => Promise<UpdateBlockResponse>;
	initialResponse?: ClassTaskBlockResponse;
	onResponseUpdate?: (response: ClassTaskBlockResponse) => Promise<UpdateBlockResponse>;
	viewMode: ViewMode;
	taskStatus: taskStatusEnum;
};

// Specific prop types for each block type
export type HeadingBlockProps = BlockProps<BlockHeadingConfig>;
export type RichTextBlockProps = BlockProps<BlockRichTextConfig>;
export type ChoiceBlockProps = BlockProps<BlockChoiceConfig>;
export type FillBlankBlockProps = BlockProps<BlockFillBlankConfig>;
export type MatchingBlockProps = BlockProps<BlockMatchingConfig>;
export type ShortAnswerBlockProps = BlockProps<BlockShortAnswerConfig>;
export type WhiteboardBlockProps = BlockProps<BlockWhiteboardConfig>;

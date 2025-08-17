import type { taskStatusEnum } from "$lib/enums";
import type { ViewMode } from "../constants";

export type BlockProps = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialConfig: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onConfigUpdate: (config: any) => Promise<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialResponse?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onResponseUpdate?: (response: any) => Promise<any>;
    viewMode: ViewMode;
    taskStatus: taskStatusEnum
}

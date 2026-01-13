import { Dialog as DialogPrimitive } from "bits-ui";

import Title from "./dialog-title.svelte";
import Footer from "./dialog-footer.svelte";
import Header from "./dialog-header.svelte";
import Overlay from "./dialog-overlay.svelte";
import Content from "./dialog-content.svelte";
import Description from "./dialog-description.svelte";

const Root = DialogPrimitive.Root;
const Trigger = DialogPrimitive.Trigger;
const Close = DialogPrimitive.Close;
const Portal = DialogPrimitive.Portal;

export {
    Root,
    Title,
    Footer,
    Header,
    Overlay,
    Content,
    Trigger,
    Close,
    Portal,
    Description,
    //
    Root as Dialog,
    Title as DialogTitle,
    Footer as DialogFooter,
    Header as DialogHeader,
    Overlay as DialogOverlay,
    Content as DialogContent,
    Trigger as DialogTrigger,
    Close as DialogClose,
    Portal as DialogPortal,
    Description as DialogDescription
};

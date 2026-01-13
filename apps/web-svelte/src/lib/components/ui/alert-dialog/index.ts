import { AlertDialog as AlertDialogPrimitive } from "bits-ui";

import Title from "./alert-dialog-title.svelte";
import Footer from "./alert-dialog-footer.svelte";
import Header from "./alert-dialog-header.svelte";
import Overlay from "./alert-dialog-overlay.svelte";
import Content from "./alert-dialog-content.svelte";
import Description from "./alert-dialog-description.svelte";
import Action from "./alert-dialog-action.svelte";
import Cancel from "./alert-dialog-cancel.svelte";

const Root = AlertDialogPrimitive.Root;
const Trigger = AlertDialogPrimitive.Trigger;
const Portal = AlertDialogPrimitive.Portal;

export {
    Root,
    Title,
    Footer,
    Header,
    Overlay,
    Content,
    Description,
    Action,
    Cancel,
    Trigger,
    Portal,
    //
    Root as AlertDialog,
    Title as AlertDialogTitle,
    Footer as AlertDialogFooter,
    Header as AlertDialogHeader,
    Overlay as AlertDialogOverlay,
    Content as AlertDialogContent,
    Description as AlertDialogDescription,
    Action as AlertDialogAction,
    Cancel as AlertDialogCancel,
    Trigger as AlertDialogTrigger,
    Portal as AlertDialogPortal
};

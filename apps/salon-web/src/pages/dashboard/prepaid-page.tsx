import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { queryKeys } from "@/lib/query-client";
import { customersService } from "@/services/customers.service";
import { prepaidService, type PrepaidCard, type PrepaidUnit } from "@/services/prepaid.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const NONE_OPTION_VALUE = "__none__";

function formatMoney(value: number) {
  return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

function formatValue(value: number, unit: PrepaidUnit) {
  if (unit === "credit") return `${Number(value || 0).toLocaleString("vi-VN")} lượt`;
  return formatMoney(value);
}

export function PrepaidPage() {
  const queryClient = useQueryClient();

  const [actionError, setActionError] = useState<string | null>(null);

  const [planName, setPlanName] = useState("");
  const [planUnit, setPlanUnit] = useState<PrepaidUnit>("vnd");
  const [planSalePrice, setPlanSalePrice] = useState("0");
  const [planInitialBalance, setPlanInitialBalance] = useState("0");
  const [planExpiryDays, setPlanExpiryDays] = useState("90");
  const [planDescription, setPlanDescription] = useState("");

  const [cardCustomerId, setCardCustomerId] = useState("");
  const [cardPlanId, setCardPlanId] = useState("");
  const [cardUnit, setCardUnit] = useState<PrepaidUnit>("vnd");
  const [cardPurchasePrice, setCardPurchasePrice] = useState("0");
  const [cardInitialBalance, setCardInitialBalance] = useState("0");
  const [cardNotes, setCardNotes] = useState("");

  const [selectedCard, setSelectedCard] = useState<PrepaidCard | null>(null);
  const [consumeAmount, setConsumeAmount] = useState("0");
  const [topupAmount, setTopupAmount] = useState("0");

  useEffect(() => {
    document.title = "Gói trả trước | SupaSalon";
  }, []);

  const plansQuery = useQuery({
    queryKey: queryKeys.prepaidPlans,
    queryFn: () => prepaidService.listPlans(),
  });

  const cardsQuery = useQuery({
    queryKey: queryKeys.prepaidCards(undefined, "all"),
    queryFn: () => prepaidService.listCards(),
  });

  const transactionsQuery = useQuery({
    queryKey: queryKeys.prepaidTransactions(),
    queryFn: () => prepaidService.listTransactions(),
  });

  const customersQuery = useQuery({
    queryKey: queryKeys.customers,
    queryFn: () => customersService.list(),
  });

  const createPlanMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      description?: string;
      unit: PrepaidUnit;
      salePrice: number;
      initialBalance: number;
      expiryDays: number;
    }) => prepaidService.createPlan(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.prepaidPlans });
    },
  });

  const createCardMutation = useMutation({
    mutationFn: (payload: {
      customerId: number;
      planId?: number;
      unit?: PrepaidUnit;
      purchasePrice?: number;
      initialBalance?: number;
      notes?: string;
    }) => prepaidService.createCard(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.prepaidCards(undefined, "all") }),
        queryClient.invalidateQueries({ queryKey: queryKeys.prepaidTransactions() }),
      ]);
    },
  });

  const consumeMutation = useMutation({
    mutationFn: (payload: { cardId: number; amount: number }) =>
      prepaidService.consumeCard(payload.cardId, { amount: payload.amount }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.prepaidCards(undefined, "all") }),
        queryClient.invalidateQueries({ queryKey: queryKeys.prepaidTransactions() }),
      ]);
    },
  });

  const topupMutation = useMutation({
    mutationFn: (payload: { cardId: number; amount: number }) =>
      prepaidService.topupCard(payload.cardId, { amount: payload.amount }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.prepaidCards(undefined, "all") }),
        queryClient.invalidateQueries({ queryKey: queryKeys.prepaidTransactions() }),
      ]);
    },
  });

  const plans = plansQuery.data ?? [];
  const cards = cardsQuery.data ?? [];
  const transactions = transactionsQuery.data ?? [];
  const customers = customersQuery.data ?? [];

  const summary = useMemo(() => {
    const activeCards = cards.filter((item) => item.status === "active").length;
    const totalBalance = cards.reduce((sum, item) => sum + Number(item.remainingBalance || 0), 0);
    const consumedToday = transactions
      .filter((item) => {
        if (item.type !== "consume") return false;
        const date = new Date(item.createdAt);
        const now = new Date();
        return date.toDateString() === now.toDateString();
      })
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return {
      activeCards,
      totalBalance,
      consumedToday,
    };
  }, [cards, transactions]);

  const saving =
    createPlanMutation.isPending ||
    createCardMutation.isPending ||
    consumeMutation.isPending ||
    topupMutation.isPending;

  const error =
    actionError ??
    (plansQuery.error instanceof Error ? plansQuery.error.message : null) ??
    (cardsQuery.error instanceof Error ? cardsQuery.error.message : null) ??
    (transactionsQuery.error instanceof Error ? transactionsQuery.error.message : null) ??
    (createPlanMutation.error instanceof Error ? createPlanMutation.error.message : null) ??
    (createCardMutation.error instanceof Error ? createCardMutation.error.message : null) ??
    (consumeMutation.error instanceof Error ? consumeMutation.error.message : null) ??
    (topupMutation.error instanceof Error ? topupMutation.error.message : null);

  async function submitPlan(event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();

    const salePrice = Number(planSalePrice);
    const initialBalance = Number(planInitialBalance);
    const expiryDays = Number(planExpiryDays);

    if (!planName.trim()) {
      setActionError("Vui lòng nhập tên gói trả trước");
      return;
    }
    if (!Number.isFinite(initialBalance) || initialBalance <= 0) {
      setActionError("Giá trị gói phải lớn hơn 0");
      return;
    }

    setActionError(null);
    try {
      await createPlanMutation.mutateAsync({
        name: planName.trim(),
        description: planDescription.trim() || undefined,
        unit: planUnit,
        salePrice: Number.isFinite(salePrice) ? salePrice : 0,
        initialBalance,
        expiryDays: Number.isFinite(expiryDays) ? Math.max(1, Math.trunc(expiryDays)) : 90,
      });
      setPlanName("");
      setPlanDescription("");
      setPlanSalePrice("0");
      setPlanInitialBalance("0");
      setPlanExpiryDays("90");
    } catch {
      // handled by mutation state
    }
  }

  async function submitCard(event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();

    const customerId = Number(cardCustomerId);
    const planId = cardPlanId ? Number(cardPlanId) : undefined;
    const purchasePrice = Number(cardPurchasePrice);
    const initialBalance = Number(cardInitialBalance);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      setActionError("Vui lòng chọn khách hàng");
      return;
    }

    setActionError(null);
    try {
      await createCardMutation.mutateAsync({
        customerId,
        planId:
          typeof planId === "number" && Number.isInteger(planId) && planId > 0
            ? planId
            : undefined,
        unit: cardUnit,
        purchasePrice: Number.isFinite(purchasePrice) ? purchasePrice : undefined,
        initialBalance: Number.isFinite(initialBalance) ? initialBalance : undefined,
        notes: cardNotes.trim() || undefined,
      });
      setCardCustomerId("");
      setCardPlanId("");
      setCardNotes("");
      setCardPurchasePrice("0");
      setCardInitialBalance("0");
    } catch {
      // handled by mutation state
    }
  }

  async function consumeCard() {
    if (!selectedCard) return;
    const amount = Number(consumeAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setActionError("Số tiền/lượt sử dụng không hợp lệ");
      return;
    }

    setActionError(null);
    try {
      await consumeMutation.mutateAsync({
        cardId: selectedCard.id,
        amount,
      });
      setSelectedCard(null);
      setConsumeAmount("0");
    } catch {
      // handled by mutation state
    }
  }

  async function topupCard() {
    if (!selectedCard) return;
    const amount = Number(topupAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setActionError("Số tiền/lượt nạp không hợp lệ");
      return;
    }

    setActionError(null);
    try {
      await topupMutation.mutateAsync({
        cardId: selectedCard.id,
        amount,
      });
      setSelectedCard(null);
      setTopupAmount("0");
    } catch {
      // handled by mutation state
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-border/70 bg-linear-to-br from-white to-secondary/30 p-5 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight">Gói trả trước</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý gói liệu trình/thẻ trả trước, phát hành thẻ cho khách và trừ dần theo lần sử dụng.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-muted-foreground">Thẻ đang hoạt động</div>
          <div className="text-xl font-semibold text-primary">{summary.activeCards}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-muted-foreground">Tổng số dư đang lưu</div>
          <div className="text-xl font-semibold text-emerald-700">{formatMoney(summary.totalBalance)}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-muted-foreground">Đã trừ hôm nay</div>
          <div className="text-xl font-semibold text-amber-700">{formatMoney(summary.consumedToday)}</div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <h2 className="font-semibold">Tạo gói trả trước</h2>
          </div>
          <form className="grid gap-3" onSubmit={submitPlan}>
            <div className="grid gap-1">
              <Label>Tên gói</Label>
              <Input value={planName} onChange={(event) => setPlanName(event.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label>Mô tả</Label>
              <Input
                value={planDescription}
                onChange={(event) => setPlanDescription(event.target.value)}
                placeholder="Ví dụ: 10 buổi gội dưỡng sinh"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="grid gap-1">
                <Label>Đơn vị</Label>
                <Select value={planUnit} onValueChange={(value) => setPlanUnit(value as PrepaidUnit)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vnd">Tiền (VND)</SelectItem>
                    <SelectItem value="credit">Lượt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <Label>Hạn sử dụng (ngày)</Label>
                <Input
                  type="number"
                  min={1}
                  value={planExpiryDays}
                  onChange={(event) => setPlanExpiryDays(event.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="grid gap-1">
                <Label>Giá bán</Label>
                <Input
                  type="number"
                  min={0}
                  step={1000}
                  value={planSalePrice}
                  onChange={(event) => setPlanSalePrice(event.target.value)}
                />
              </div>
              <div className="grid gap-1">
                <Label>Giá trị gói</Label>
                <Input
                  type="number"
                  min={1}
                  step={planUnit === "credit" ? 1 : 1000}
                  value={planInitialBalance}
                  onChange={(event) => setPlanInitialBalance(event.target.value)}
                />
              </div>
            </div>
            <div>
              <Button type="submit" disabled={saving}>
                <Plus className="mr-2 h-4 w-4" />
                Tạo gói
              </Button>
            </div>
          </form>

          <div className="mt-4 overflow-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gói</TableHead>
                  <TableHead className="text-right">Giá bán</TableHead>
                  <TableHead className="text-right">Giá trị</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                      Chưa có gói nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <div className="font-medium">{plan.name}</div>
                        <div className="text-xs text-muted-foreground">
                          HSD: {plan.expiryDays} ngày · {plan.unit === "credit" ? "Lượt" : "VND"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatMoney(plan.salePrice)}</TableCell>
                      <TableCell className="text-right">{formatValue(plan.initialBalance, plan.unit)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 font-semibold">Phát hành thẻ trả trước</h2>
          <form className="grid gap-3" onSubmit={submitCard}>
            <div className="grid gap-1">
              <Label>Khách hàng</Label>
              <Select
                value={cardCustomerId || NONE_OPTION_VALUE}
                onValueChange={(value) => setCardCustomerId(value === NONE_OPTION_VALUE ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_OPTION_VALUE}>Chọn khách hàng</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={String(customer.id)}>
                      {customer.name} · {customer.phone || "-"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1">
              <Label>Gói áp dụng (tuỳ chọn)</Label>
              <Select
                value={cardPlanId || NONE_OPTION_VALUE}
                onValueChange={(value) => {
                  const planId = value === NONE_OPTION_VALUE ? "" : value;
                  setCardPlanId(planId);
                  if (!planId) return;

                  const selectedPlan = plans.find((item) => String(item.id) === planId);
                  if (!selectedPlan) return;
                  setCardUnit(selectedPlan.unit);
                  setCardPurchasePrice(String(selectedPlan.salePrice));
                  setCardInitialBalance(String(selectedPlan.initialBalance));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_OPTION_VALUE}>Không dùng template</SelectItem>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={String(plan.id)}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="grid gap-1">
                <Label>Đơn vị</Label>
                <Select value={cardUnit} onValueChange={(value) => setCardUnit(value as PrepaidUnit)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vnd">Tiền (VND)</SelectItem>
                    <SelectItem value="credit">Lượt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <Label>Giá bán</Label>
                <Input
                  type="number"
                  min={0}
                  value={cardPurchasePrice}
                  onChange={(event) => setCardPurchasePrice(event.target.value)}
                />
              </div>
              <div className="grid gap-1">
                <Label>Giá trị thẻ</Label>
                <Input
                  type="number"
                  min={1}
                  value={cardInitialBalance}
                  onChange={(event) => setCardInitialBalance(event.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-1">
              <Label>Ghi chú</Label>
              <Input value={cardNotes} onChange={(event) => setCardNotes(event.target.value)} />
            </div>

            <div>
              <Button type="submit" disabled={saving}>Phát hành thẻ</Button>
            </div>
          </form>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 font-semibold">Danh sách thẻ trả trước</h2>
        <div className="overflow-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã thẻ</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead className="text-right">Số dư</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cards.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    Chưa có thẻ nào.
                  </TableCell>
                </TableRow>
              ) : (
                cards.map((card) => (
                  <TableRow key={card.id}>
                    <TableCell>
                      <div className="font-medium">{card.cardCode}</div>
                      <div className="text-xs text-muted-foreground">
                        {card.plan?.name || "Không theo gói"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {card.customer?.name || `#${card.customerId}`}
                      <div className="text-xs text-muted-foreground">{card.unit === "credit" ? "Lượt" : "VND"}</div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatValue(card.remainingBalance, card.unit)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCard(card);
                            setTopupAmount("0");
                            setConsumeAmount("0");
                          }}
                        >
                          Nạp/Trừ
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {selectedCard ? (
          <div className="mt-4 rounded-lg border bg-muted/20 p-3">
            <div className="mb-2 text-sm">
              Thẻ <span className="font-medium">{selectedCard.cardCode}</span> - còn lại{" "}
              <span className="font-medium">
                {formatValue(selectedCard.remainingBalance, selectedCard.unit)}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Trừ sử dụng</Label>
                <Input
                  type="number"
                  min={1}
                  value={consumeAmount}
                  onChange={(event) => setConsumeAmount(event.target.value)}
                />
                <Button variant="outline" disabled={saving} onClick={() => void consumeCard()}>
                  Xác nhận trừ
                </Button>
              </div>
              <div className="grid gap-2">
                <Label>Nạp thêm</Label>
                <Input
                  type="number"
                  min={1}
                  value={topupAmount}
                  onChange={(event) => setTopupAmount(event.target.value)}
                />
                <Button variant="outline" disabled={saving} onClick={() => void topupCard()}>
                  Xác nhận nạp
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 font-semibold">Lịch sử giao dịch thẻ</h2>
        <div className="max-h-[360px] overflow-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Thẻ</TableHead>
                <TableHead className="text-right">Số tiền</TableHead>
                <TableHead className="text-right">Số dư sau</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    Chưa có giao dịch.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell>{tx.type}</TableCell>
                    <TableCell>{tx.card?.cardCode || `#${tx.cardId}`}</TableCell>
                    <TableCell className="text-right">{formatMoney(tx.amount)}</TableCell>
                    <TableCell className="text-right">{formatMoney(tx.balanceAfter)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

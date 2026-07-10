import Link from "next/link"
import type { Metadata } from "next"
import { ArrowLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "Termos de Uso e Política de Reembolso — Elevanthe CRM",
  description: "Leia os Termos de Uso, Política de Reembolso e demais condições da plataforma Elevanthe CRM.",
}

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-5 py-12">

        {/* Voltar */}
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="size-4" />
          Voltar para o login
        </Link>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-black tracking-tight text-foreground mb-2">
            Termos de Uso e Política de Reembolso
          </h1>
          <p className="text-sm text-muted-foreground">
            Última atualização: julho de 2026 &mdash; Elevanthe Tecnologia
          </p>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10 text-sm leading-relaxed">

          {/* 1 */}
          <section>
            <h2 className="text-base font-bold text-foreground mb-3">1. Aceitação dos Termos</h2>
            <p className="text-muted-foreground">
              Ao criar uma conta, efetuar login ou utilizar qualquer funcionalidade da plataforma Elevanthe CRM
              (&quot;Plataforma&quot;), você (&quot;Usuário&quot;) declara ter lido, compreendido e concordado integralmente com estes
              Termos de Uso. Caso não concorde com qualquer parte destes Termos, não utilize a Plataforma.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-base font-bold text-foreground mb-3">2. Descrição do Serviço</h2>
            <p className="text-muted-foreground">
              O Elevanthe CRM é uma plataforma de gestão de relacionamento com clientes voltada a prestadores de serviços,
              disponibilizada sob modelo de assinatura por prazo determinado (plano Start de 7 dias, plano Business
              mensal de 30 dias e plano Enterprise anual de 360 dias). O acesso às funcionalidades está condicionado à
              existência de uma licença ativa e em vigor.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-base font-bold text-foreground mb-3">3. Pagamento e Licença</h2>
            <p className="text-muted-foreground mb-2">
              Os pagamentos são processados de forma única (não há cobrança recorrente automática). Após confirmação do
              pagamento, a licença é ativada pelo período correspondente ao plano adquirido. O Usuário é responsável
              por renovar sua licença antes do vencimento para manter acesso contínuo.
            </p>
            <p className="text-muted-foreground">
              Cupons promocionais e códigos de desconto têm validade limitada e não são acumuláveis salvo indicação
              expressa.
            </p>
          </section>

          {/* 4 — Reembolso */}
          <section className="border border-destructive/20 bg-destructive/5 rounded-xl px-6 py-5">
            <h2 className="text-base font-bold text-foreground mb-3">4. Política de Reembolso</h2>
            <p className="text-muted-foreground mb-3">
              <strong className="text-foreground">4.1 Solicitação de cancelamento do pagamento (chargeback).</strong>{" "}
              Caso o Usuário solicite o cancelamento ou estorno do pagamento junto à operadora de cartão, banco ou
              meio de pagamento utilizado (&quot;chargeback&quot;) sem antes entrar em contato conosco pelo suporte oficial,
              o acesso à plataforma será <strong className="text-foreground">suspenso imediatamente</strong> após a
              confirmação da contestação. Todos os dados do Usuário poderão ser retidos pelo prazo legal até a
              conclusão da disputa.
            </p>
            <p className="text-muted-foreground mb-3">
              <strong className="text-foreground">4.2 Reembolso voluntário.</strong>{" "}
              Reembolsos podem ser solicitados dentro de <strong className="text-foreground">7 (sete) dias corridos</strong> a
              partir da data de ativação do plano, desde que o Usuário não tenha utilizado as funcionalidades pagas de
              forma extensiva (envio de mais de 10 documentos, criação de mais de 20 clientes ou registros). A análise
              é feita em até 5 dias úteis pelo suporte.
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">4.3 Casos não elegíveis.</strong>{" "}
              Não são elegíveis a reembolso: renovações de plano após o período de 7 dias, planos cujo acesso já
              expirou, e casos em que a suspensão se deu por violação destes Termos.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-base font-bold text-foreground mb-3">5. Responsabilidades do Usuário</h2>
            <ul className="list-disc list-outside ml-4 space-y-1.5 text-muted-foreground">
              <li>Manter suas credenciais de acesso em sigilo e não compartilhá-las com terceiros.</li>
              <li>Utilizar a Plataforma apenas para fins lícitos e de acordo com a legislação brasileira.</li>
              <li>Não realizar engenharia reversa, extração de dados em massa ou uso automatizado não autorizado.</li>
              <li>Manter atualizados os dados de contato cadastrados (e-mail, telefone).</li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-base font-bold text-foreground mb-3">6. Suspensão e Cancelamento</h2>
            <p className="text-muted-foreground">
              A Elevanthe reserva-se o direito de suspender ou encerrar contas que violem estes Termos, realizem
              chargebacks indevidos, ou representem risco de fraude. Em casos de suspensão por violação, não há
              direito a reembolso. O Usuário pode cancelar sua conta a qualquer momento pelo suporte; os dados são
              mantidos por 90 dias antes da exclusão definitiva, conforme a LGPD.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-base font-bold text-foreground mb-3">7. Privacidade e Dados</h2>
            <p className="text-muted-foreground">
              Os dados inseridos na Plataforma (clientes, orçamentos, transações) são de propriedade do Usuário e
              tratados conforme a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018). A Elevanthe não vende
              dados a terceiros. Para detalhes sobre coleta, uso e exclusão de dados, consulte nossa Política de
              Privacidade disponível em{" "}
              <a href="https://www.elevanthe.com/privacidade" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">
                elevanthe.com/privacidade
              </a>.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-base font-bold text-foreground mb-3">8. Limitação de Responsabilidade</h2>
            <p className="text-muted-foreground">
              A Elevanthe não se responsabiliza por perdas indiretas, lucros cessantes ou danos decorrentes de
              interrupções de serviço por manutenção programada, falhas de terceiros (provedores de nuvem, gateways
              de pagamento) ou casos de força maior. O serviço é fornecido &quot;como está&quot; e eventuais
              indisponibilidades serão comunicadas com antecedência sempre que possível.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-base font-bold text-foreground mb-3">9. Alterações nestes Termos</h2>
            <p className="text-muted-foreground">
              A Elevanthe pode atualizar estes Termos a qualquer momento. Alterações relevantes serão comunicadas
              via e-mail cadastrado e/ou notificação na plataforma com antecedência mínima de 10 dias. O uso
              continuado após a vigência das alterações implica aceitação das novas condições.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-base font-bold text-foreground mb-3">10. Contato e Suporte</h2>
            <p className="text-muted-foreground">
              Dúvidas, solicitações de reembolso ou reclamações devem ser enviadas pelo suporte integrado na
              plataforma (menu Suporte) ou pelo WhatsApp oficial disponível em{" "}
              <a href="https://www.elevanthe.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">
                elevanthe.com
              </a>.
              Foro eleito: comarca de domicílio da Elevanthe Tecnologia, com aplicação da legislação brasileira.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Elevanthe Tecnologia. Todos os direitos reservados.
          </p>
          <Link
            href="/sign-in"
            className="text-xs font-semibold underline text-muted-foreground hover:text-foreground transition-colors"
          >
            Voltar para o login
          </Link>
        </div>

      </div>
    </div>
  )
}

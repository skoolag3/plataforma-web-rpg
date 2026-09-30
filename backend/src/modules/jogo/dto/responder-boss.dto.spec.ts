import { validate } from 'class-validator';
import { ResponderBossDto } from './responder-boss.dto';

describe('ResponderBossDto', () => {
  async function erros(resposta: string) {
    const dto = new ResponderBossDto();
    dto.resposta = resposta;
    return validate(dto);
  }

  it('aceita respostas entre 5 e 200 caracteres', async () => {
    expect(await erros('Lutarei')).toHaveLength(0);
    expect(await erros('a'.repeat(200))).toHaveLength(0);
  });

  it('rejeita respostas fora do limite', async () => {
    expect(await erros('abcd')).not.toHaveLength(0);
    expect(await erros('a'.repeat(201))).not.toHaveLength(0);
  });
});

<script lang="ts">
    import { goto } from '$app/navigation';
    import { HeadIOS } from '$lib/components/HeadIOS';
    import { pageNameStore } from '$lib/components/Header';

    pageNameStore.set('Gravitrips');
</script>

<HeadIOS title="Gravitrips" description="Gravitrips" iconPath="/gravitrips.png" />

<div class="page-intro">
    <div>
        Gravitrips (which you might know as <a href="https://en.wikipedia.org/wiki/Connect_Four">
            Connect Four</a
        >) is a classic two-player strategy game where players take turns dropping pieces into a
        grid, aiming to align four in a row. On this page, you can challenge a friend on the same
        computer or test your skills against computer opponents with different AI strategies.
    </div>
    <br />
    <div>
        Some resources:
        <ul>
            <li>
                <a
                    href="https://www.quora.com/What-is-the-winning-strategy-for-the-first-player-in-Connect-Four-games"
                >
                    Quora thread</a
                > with some tips on the winning strategy
            </li>
            <li>
                <a href="http://statox.fr/uploads/a-knowledge-based-approach-of-connect-four.pdf"
                    >A Knowledge-based Approach of Connect-Four - Victor Allis</a
                >. The first paper solving the game and proposing rules to follow to win or force a
                draw.
            </li>
            <li>
                <a href="https://drimify.com/en/resources/connect-four-strategy-win-time-play/">
                    A bogus marketting article</a
                > talking about some human stategies
            </li>
        </ul>
    </div>
</div>

<button onclick={() => goto('gravitrips/1player')}>Local game</button>
<button onclick={() => goto('gravitrips/2players')}>Online game</button>
